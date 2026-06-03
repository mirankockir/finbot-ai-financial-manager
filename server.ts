import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = "0.0.0.0";

app.use(express.json({ limit: "10mb" }));

// Lazy initializer for Google GenAI to prevent startup crashes when API key is missing
let aiInstance: GoogleGenAI | null = null;
function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or API_KEY is not defined in environment variables.");
    }
    aiInstance = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

// Ensure error response utility
const handleApiError = (res: express.Response, error: any, customMsg: string) => {
  console.error(customMsg, error);
  res.status(500).json({ error: customMsg, details: error.message || String(error) });
};

// 1. Gemini Route: Get Financial Advice
app.post("/api/gemini/advice", async (req, res) => {
  try {
    const { spendingData } = req.body;
    if (!spendingData) {
      res.status(400).json({ error: "spendingData is required" });
      return;
    }
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyze this spending data and provide 2 concise, helpful financial tips in Turkish. Data: ${spendingData}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              icon: { type: Type.STRING, description: 'Material Icon name like "savings" or "bolt"' },
              benefit: { type: Type.STRING },
            },
            required: ["title", "description", "icon", "benefit"],
          },
        },
      },
    });
    res.json(JSON.parse(response.text || "[]"));
  } catch (error) {
    handleApiError(res, error, "Financial Advice Generation Error");
  }
});

// 2. Gemini Route: Chat with FinBot
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { history, userMessage } = req.body;
    if (!userMessage) {
      res.status(400).json({ error: "userMessage is required" });
      return;
    }
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [...(history || []), { role: "user", parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: "You are FinBot, a friendly AI financial assistant. Keep responses helpful, concise, and professional. You help users save money and manage bills. Speak the language the user speaks (primarily Turkish or English).",
      },
    });
    res.json({ text: response.text || "" });
  } catch (error) {
    handleApiError(res, error, "Chat Assistant Error");
  }
});

// 3. Gemini Route: Parse Statement
app.post("/api/gemini/parse-statement", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText) {
      res.status(400).json({ error: "rawText is required" });
      return;
    }
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Extract transactions from this raw bank statement text. Return an array of objects.\nRaw Text: ${rawText}`,
      config: {
        systemInstruction: "You are a data extractor. Convert bank statement text into structured transaction data in Turkish. Use appropriate Material Icons. Categories should be one of: Gıda, Market, Ulaşım, Eğlence, Faturalar, Maaş, Diğer.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              amount: { type: Type.NUMBER, description: "Negative for expense, positive for income" },
              date: { type: Type.STRING, description: "Format like '25 Eki'" },
              type: { type: Type.STRING, enum: ["expense", "income"] },
              icon: { type: Type.STRING },
            },
            required: ["title", "category", "amount", "date", "type", "icon"],
          },
        },
      },
    });
    res.json(JSON.parse(response.text || "[]"));
  } catch (error) {
    handleApiError(res, error, "Statement Parsing Error");
  }
});

async function main() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in development mode with active Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode serving pre-built assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { dotfiles: "allow" }));
    app.get("/.well-known/assetlinks.json", (req, res) => {
      res.setHeader("Content-Type", "application/json");
      res.sendFile(path.join(distPath, ".well-known", "assetlinks.json"));
    });
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`Server successfully started and listening at http://${HOST}:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Critical server startup failure:", err);
  process.exit(1);
});
