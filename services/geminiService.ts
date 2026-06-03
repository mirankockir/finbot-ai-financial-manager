// Client-side wrapper service that calls our secure server-side API endpoints

// Simple in-memory cache to avoid redundant calls for identical data
const adviceCache: Record<string, any> = {};

/**
 * Utility for retrying async operations with exponential backoff.
 * Mitigates transient network or rate limiting errors.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      console.warn(`Request failed. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export const getFinancialAdvice = async (spendingData: string) => {
  // Return cached result if we've already asked for this specific data string
  if (adviceCache[spendingData]) {
    return adviceCache[spendingData];
  }

  return withRetry(async () => {
    const response = await fetch("/api/gemini/advice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ spendingData })
    });

    if (!response.ok) {
      throw new Error(`Server returned error status: ${response.status}`);
    }

    const result = await response.json();
    adviceCache[spendingData] = result;
    return result;
  }).catch(error => {
    console.error("Gemini Advice Final Error:", error);
    // Return a default fallback to keep the UI functional
    return [
      {
        title: "Bütçe Kontrolü",
        description: "Harcamalarınızı düzenli olarak takip ederek tasarruf edebilirsiniz.",
        icon: "account_balance_wallet",
        benefit: "Finansal Özgürlük"
      }
    ];
  });
};

export const chatWithFinBot = async (history: { role: string; parts: { text: string }[] }[], userMessage: string) => {
  return withRetry(async () => {
    const response = await fetch("/api/gemini/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ history, userMessage })
    });

    if (!response.ok) {
      throw new Error(`Server returned error status: ${response.status}`);
    }

    const result = await response.json();
    return result.text || "Pardon, cevap alınamadı.";
  }).catch(error => {
    console.error("Gemini Chat Final Error:", error);
    return "Şu an bağlantı kuramıyorum. Lütfen daha sonra tekrar deneyin.";
  });
};

export const parseBankStatement = async (rawText: string) => {
  return withRetry(async () => {
    const response = await fetch("/api/gemini/parse-statement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ rawText })
    });

    if (!response.ok) {
      throw new Error(`Server returned error status: ${response.status}`);
    }

    return await response.json();
  }).catch(error => {
    console.error("Gemini Parsing Final Error:", error);
    return [];
  });
};
