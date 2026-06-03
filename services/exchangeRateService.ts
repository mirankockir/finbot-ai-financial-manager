
import { calculateTotalWealthInTRY } from '../utils/financeUtils';
import { Account } from '../types';

export type Currency = 'TRY' | 'USD' | 'EUR' | 'GBP' | 'GOLD';

const API_URL = `https://open.er-api.com/v6/latest/USD`;
const CACHE_KEY = 'finbot_currency_cache';
const PREV_CACHE_KEY = 'finbot_currency_prev_cache'; 
const CACHE_DURATION = 3600000; // 1 Saat

const FALLBACK_RATES: Record<Currency, number> = {
  'TRY': 1,
  'USD': 34.35,
  'EUR': 37.25,
  'GBP': 44.60,
  'GOLD': 3050.00
};

export interface VolatilityStatus {
  hasSignificantChange: boolean;
  currency: string;
  percentChange: number;
  direction: 'up' | 'down';
  impactInTRY: number;
}

class ExchangeRateService {
  private static currentRates: Record<Currency, number> = { ...FALLBACK_RATES };
  private static prevRates: Record<Currency, number> = { ...FALLBACK_RATES };

  static async syncRates(): Promise<Record<Currency, number>> {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const prevCached = localStorage.getItem(PREV_CACHE_KEY);
      
      if (prevCached) {
        this.prevRates = JSON.parse(prevCached).rates;
      }

      if (cached) {
        const { rates, timestamp } = JSON.parse(cached);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;
        
        if (!isExpired) {
          this.currentRates = rates;
          return rates;
        } else {
          localStorage.setItem(PREV_CACHE_KEY, cached);
          this.prevRates = rates;
        }
      }

      const response = await fetch(API_URL);
      if (!response.ok) throw new Error(`Döviz servisine ulaşılamadı: ${response.status}`);
      
      const result = await response.json();
      const rates = result.rates;

      if (rates && rates.TRY) {
        const usdToTry = rates.TRY;
        const newRates: Record<Currency, number> = {
          'TRY': 1,
          'USD': usdToTry,
          'EUR': rates.EUR ? usdToTry / rates.EUR : FALLBACK_RATES.EUR,
          'GBP': rates.GBP ? usdToTry / rates.GBP : FALLBACK_RATES.GBP,
          'GOLD': FALLBACK_RATES.GOLD
        };

        this.currentRates = newRates;
        this.saveToCache(newRates);
        return newRates;
      }
      
      return this.currentRates;
    } catch (error) {
      console.warn("FinBot: Kur servisi hatası. Yedek kurlar kullanılıyor.");
      return this.currentRates;
    }
  }

  private static saveToCache(rates: Record<Currency, number>) {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      rates,
      timestamp: Date.now()
    }));
  }

  static getVolatilityStatus(accounts: Account[]): VolatilityStatus | null {
    const threshold = 2.0; 
    const currenciesToCheck: Currency[] = ['USD', 'EUR', 'GBP', 'GOLD'];

    for (const cur of currenciesToCheck) {
      const current = this.currentRates[cur];
      const previous = this.prevRates[cur];
      
      if (!current || !previous || current === previous) continue;

      const change = ((current - previous) / previous) * 100;

      if (Math.abs(change) >= threshold) {
        const totalInCurrency = accounts
          .filter(acc => acc.currencyType.toUpperCase() === cur)
          .reduce((sum, acc) => sum + acc.balance, 0);

        if (totalInCurrency === 0) continue;

        const impactInTRY = totalInCurrency * (current - previous);

        return {
          hasSignificantChange: true,
          currency: cur,
          percentChange: Math.abs(change),
          direction: change > 0 ? 'up' : 'down',
          impactInTRY: Math.abs(impactInTRY)
        };
      }
    }

    return null;
  }

  static convertToTRY(amount: number, from: string): number {
    const currency = from.toUpperCase() as Currency;
    const rate = this.currentRates[currency] || FALLBACK_RATES[currency] || 1;
    return amount * rate;
  }

  static calculateTotalWealth(accounts: Account[]): number {
    // Merkezi utility fonksiyonu kullanıyoruz
    return calculateTotalWealthInTRY(accounts, this.currentRates);
  }

  static getWealthBreakdown(accounts: Account[]) {
    const breakdown = { cash: 0, foreign: 0, investment: 0 };
    accounts.forEach(acc => {
      const tryValue = this.convertToTRY(acc.balance, acc.currencyType);
      if (acc.currencyType === 'TRY') breakdown.cash += tryValue;
      else if (acc.currencyType === 'GOLD') breakdown.investment += tryValue;
      else breakdown.foreign += tryValue;
    });
    return breakdown;
  }

  static getRates() {
    return { ...this.currentRates };
  }

  static getIconForCurrency(currency: string): string {
    switch (currency.toUpperCase()) {
      case 'USD': return 'attach_money';
      case 'EUR': return 'euro';
      case 'GBP': return 'currency_pound';
      case 'GOLD': return 'diamond';
      default: return 'account_balance_wallet';
    }
  }
}

export default ExchangeRateService;
