
import { Transaction, Project, Account } from '../types';
import ExchangeRateService from './exchangeRateService';

export interface WalletSummary {
  totalWealth: number;    // Brüt toplam varlık
  mainDisposable: number; // Harcanabilir ana bütçe (Rezervler düştükten sonra)
  subWalletTotal: number; // Alt cüzdanlardaki toplam varlık
  velocity: number;       // Günlük harcama hızı
  forecast: number;       // Ay sonu tahmini
  healthScore: number;    // 0-100 arası finansal sağlık skoru
  breakdown: { cash: number; foreign: number; investment: number };
}

class WalletController {
  static calculateSummary(
    transactions: Transaction[], 
    accounts: Account[], 
    projects: Project[]
  ): WalletSummary {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const remainingDays = daysInMonth - dayOfMonth;

    // 1. Reaktif Toplam Varlık Hesaplama (Observed via ExchangeRateService)
    const totalWealth = ExchangeRateService.calculateTotalWealth(accounts);
    const wealthBreakdown = ExchangeRateService.getWealthBreakdown(accounts);

    // 2. Alt Cüzdanlardaki Rezerve Edilmiş Tutarlar
    const reservedInSubWallets = projects
      .filter(p => p.status === 'active')
      .reduce((acc, curr) => {
        const projectExpenses = transactions
          .filter(t => t.projectId === curr.id && t.type === 'expense')
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
        
        return acc + (curr.budget - projectExpenses);
      }, 0);

    // 3. İzole Edilmiş Harcama Hızı
    const generalExpenses = transactions
      .filter(t => !t.projectId && t.type === 'expense' && t.date.includes(this.getCurrentMonthAbbr()))
      .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

    const dailyVelocity = dayOfMonth > 0 ? generalExpenses / dayOfMonth : 0;

    // 4. Gelecek Tahmini ve Net Harcanabilir Para
    const expectedFutureGeneralExpense = dailyVelocity * remainingDays;
    const mainDisposable = totalWealth - reservedInSubWallets;
    const forecast = mainDisposable - expectedFutureGeneralExpense;

    // 5. Sağlık Skoru (Gelişmiş Algoritma)
    let healthScore = 100;
    if (forecast < 0) healthScore = 20;
    else if (forecast < mainDisposable * 0.2) healthScore = 50;
    else if (dailyVelocity > (mainDisposable / daysInMonth) * 1.5) healthScore = 70;

    return {
      totalWealth,
      mainDisposable,
      subWalletTotal: reservedInSubWallets,
      velocity: dailyVelocity,
      forecast,
      healthScore,
      breakdown: wealthBreakdown
    };
  }

  private static getCurrentMonthAbbr(): string {
    return ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][new Date().getMonth()];
  }
}

export default WalletController;
