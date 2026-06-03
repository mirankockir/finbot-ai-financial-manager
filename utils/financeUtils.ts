
import { Account, Transaction, Project } from '../types';

/**
 * Tasarruf oranını hesaplar.
 */
export const calculateSavingsRate = (income: number, expense: number): number => {
  if (!income || income <= 0) return 0;
  const savings = income - expense;
  return (savings / income) * 100;
};

/**
 * Harcama hızını analiz eder ve ay sonu tahmini gideri hesaplar.
 */
export const calculateSpendingForecast = (currentSpending: number) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  
  const daysElapsed = currentDay || 1;
  const dailyAverage = Math.abs(currentSpending) / daysElapsed;
  const forecastedTotal = dailyAverage * totalDaysInMonth;
  
  return { dailyAverage, forecastedTotal, daysElapsed, totalDaysInMonth };
};

/**
 * Tüm hesaplardaki parayı TRY'ye çevirip toplam değeri hesaplar.
 */
export const calculateTotalWealthInTRY = (accounts: Account[], rates: Record<string, number>): number => {
  if (!accounts || accounts.length === 0) return 0;
  return accounts.reduce((total, account) => {
    const currency = account.currencyType.toUpperCase();
    const rate = currency === 'TRY' ? 1 : (rates[currency] || 1);
    return total + (account.balance * rate);
  }, 0);
};

/**
 * Sadece bugünün tarihine sahip işlemleri filtreler.
 */
export const getTodayTransactions = (transactions: Transaction[]): Transaction[] => {
  const now = new Date();
  const todayStr = now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }).replace('.', '');
  return transactions.filter(t => t.date === 'Bugün' || t.date.includes(todayStr));
};

/**
 * Bugün yapılan harcamaların toplam tutarını hesaplar.
 */
export const calculateTodayTotal = (transactions: Transaction[], projectId?: string): number => {
  const todayTxs = getTodayTransactions(transactions);
  return todayTxs
    .filter(t => t.type === 'expense' && (!projectId || t.projectId === projectId))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
};

/**
 * Seyahat istatistiklerini hesaplar.
 */
export const getTripStats = (trip: Project, transactions: Transaction[]) => {
  const tripTxs = transactions.filter(t => t.projectId === trip.id);
  const totalSpent = tripTxs.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const remainingBudget = trip.budget - totalSpent;
  
  const now = new Date();
  const end = trip.endDate ? new Date(trip.endDate) : new Date();
  const diffTime = end.getTime() - now.getTime();
  const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  
  const dailyTarget = remainingDays > 0 ? remainingBudget / remainingDays : 0;
  const spentToday = calculateTodayTotal(transactions, trip.id);
  
  return {
    totalSpent,
    remainingBudget,
    remainingDays,
    dailyTarget,
    spentToday,
    tripTxs
  };
};

/**
 * Son 7 günün harcamalarını gün gün gruplar.
 */
export const getWeeklySpendingData = (transactions: Transaction[]) => {
  const days = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
  const result = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dStr = d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }).replace('.', '');
    const dayName = days[d.getDay()];
    
    const amount = transactions
      .filter(t => t.type === 'expense' && (t.date.includes(dStr) || (i === 0 && t.date === 'Bugün')))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    result.push({ label: dayName, amount, isWeekend: d.getDay() === 0 || d.getDay() === 6 });
  }
  return result;
};

/**
 * Ayın 1'inden bugüne kümülatif harcama trendini hesaplar.
 */
export const getMonthlyTrendData = (transactions: Transaction[]) => {
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.toLocaleDateString('tr-TR', { month: 'short' }).replace('.', '');
  
  const dailyData = new Array(currentDay).fill(0);
  
  transactions.forEach(t => {
    if (t.type !== 'expense') return;
    let day = 0;
    if (t.date === 'Bugün') day = currentDay;
    else if (t.date === 'Dün') day = currentDay - 1;
    else if (t.date.includes(currentMonth)) {
      const match = t.date.match(/^\d+/);
      if (match) day = parseInt(match[0]);
    }
    
    if (day > 0 && day <= currentDay) {
      dailyData[day - 1] += Math.abs(t.amount);
    }
  });

  let cumulative = 0;
  return dailyData.map((amt, idx) => {
    cumulative += amt;
    return { day: idx + 1, amount: cumulative };
  });
};
