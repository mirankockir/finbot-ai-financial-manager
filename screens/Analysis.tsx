
import React, { useState, useMemo } from 'react';
import { Transaction, Screen, Account } from '../types';
import { 
  calculateSavingsRate, 
  calculateSpendingForecast, 
  getWeeklySpendingData, 
  getMonthlyTrendData 
} from '../utils/financeUtils';
import DailySummary from '../components/DailySummary';

interface AnalysisProps {
  transactions: Transaction[];
  accounts: Account[];
  onScreenChange?: (screen: Screen) => void;
  isPrivateMode?: boolean;
}

const MONTH_MAP: Record<string, string> = {
  'Oca': 'Ocak', 'Şub': 'Şubat', 'Mar': 'Mart', 'Nis': 'Nisan', 
  'Mayıs': 'Mayıs', 'Haz': 'Haziran', 'Temmuz': 'Temmuz', 'Ağu': 'Ağustos', 
  'Eyl': 'Eylül', 'Eki': 'Ekim', 'Kas': 'Kasım', 'Ara': 'Aralık'
};

const MONTH_ORDER = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

const Analysis: React.FC<AnalysisProps> = ({ transactions, accounts, onScreenChange, isPrivateMode = false }) => {
  const [allocationView, setAllocationView] = useState<'currency' | 'bank'>('currency');
  
  const today = new Date();
  const currentMonthIdx = today.getMonth();
  const currentMonthAbbr = MONTH_ORDER[currentMonthIdx];

  const availableMonthsAbbr = useMemo(() => {
    const found = new Set<string>();
    transactions.forEach(t => {
      if (t.date === 'Bugün' || t.date === 'Dün') found.add(currentMonthAbbr);
      else {
        const match = MONTH_ORDER.find(abbr => t.date.includes(abbr));
        if (match) found.add(match);
      }
    });
    return MONTH_ORDER.filter(abbr => found.has(abbr));
  }, [transactions, currentMonthAbbr]);

  const [selectedAbbr, setSelectedAbbr] = useState<string>(() => {
    if (availableMonthsAbbr.includes(currentMonthAbbr)) return currentMonthAbbr;
    return availableMonthsAbbr[availableMonthsAbbr.length - 1] || currentMonthAbbr;
  });

  const weeklyData = useMemo(() => getWeeklySpendingData(transactions), [transactions]);
  const monthlyTrend = useMemo(() => getMonthlyTrendData(transactions), [transactions]);

  const visualInsights = useMemo(() => {
    const maxDay = [...weeklyData].sort((a, b) => b.amount - a.amount)[0];
    const weekendSum = weeklyData.filter(d => d.isWeekend).reduce((a, b) => a + b.amount, 0);
    const weekdaySum = weeklyData.filter(d => !d.isWeekend).reduce((a, b) => a + b.amount, 0);
    const weekendAvg = weekendSum / 2;
    const weekdayAvg = weekdaySum / 5;
    
    let distributionComment = "Harcamaların hafta içine yayılmış durumda.";
    if (weekendAvg > weekdayAvg * 1.5) distributionComment = "Hafta sonu harcamaların hafta içine göre %50 daha fazla!";
    else if (weekdayAvg > weekendAvg * 1.5) distributionComment = "Hafta içi bütçeni daha yoğun kullanıyorsun.";

    return { maxDay: maxDay?.label || '-', distributionComment };
  }, [weeklyData]);

  const assetAllocation = useMemo(() => {
    const totals: Record<string, number> = {};
    accounts.forEach(acc => {
      const key = allocationView === 'currency' ? acc.currencyType : acc.bankName;
      totals[key] = (totals[key] || 0) + acc.valueInTRY;
    });
    const totalWealth = Object.values(totals).reduce((a, b) => a + b, 0);
    const sorted = Object.entries(totals)
      .map(([name, value]) => ({ name, value, percent: totalWealth > 0 ? (value / totalWealth) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);
    const colors = ['#006c75', '#2b8cee', '#81c784', '#eab308', '#f43f5e', '#8b5cf6'];
    let acc = 0;
    const segments = sorted.map((item, idx) => {
      const dashArray = `${item.percent} ${100 - item.percent}`;
      const dashOffset = -acc;
      acc += item.percent;
      return { ...item, dashArray, dashOffset, color: colors[idx % colors.length] };
    });
    return { segments, totalWealth };
  }, [accounts, allocationView]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      if (selectedAbbr === currentMonthAbbr && (t.date === 'Bugün' || t.date === 'Dün')) return true;
      return t.date.includes(selectedAbbr);
    });
  }, [transactions, selectedAbbr, currentMonthAbbr]);

  const totalExpense = useMemo(() => filteredTransactions.filter(t => t.amount < 0).reduce((acc, curr) => acc + Math.abs(curr.amount), 0), [filteredTransactions]);
  const totalIncome = useMemo(() => filteredTransactions.filter(t => t.amount > 0).reduce((acc, curr) => acc + curr.amount, 0), [filteredTransactions]);

  const formatAmount = (val: number) => {
    if (isPrivateMode) return '••••';
    return `₺${val.toLocaleString('tr-TR')}`;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-bg-dark font-manrope overflow-y-auto no-scrollbar scroll-smooth pb-32">
      
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-bg-dark/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 px-6 pt-12 pb-4 transition-all">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => onScreenChange?.(Screen.Checkup)} className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary active:scale-90 transition-all shadow-sm">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div className="text-center">
            <h2 className="text-lg font-black tracking-tight">Finansal Analiz</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{MONTH_MAP[selectedAbbr] || selectedAbbr} 2024</p>
          </div>
          <button className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {availableMonthsAbbr.map(abbr => (
            <button key={abbr} onClick={() => setSelectedAbbr(abbr)} className={`text-xs font-black whitespace-nowrap px-1 pb-2 border-b-2 transition-all ${selectedAbbr === abbr ? 'text-primary border-primary' : 'text-slate-300 border-transparent hover:text-slate-400'}`}>
              {MONTH_MAP[abbr]?.toUpperCase() || abbr.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <main className="p-6 space-y-10">
        <DailySummary transactions={transactions} isPrivateMode={isPrivateMode} />

        <section className="bg-white dark:bg-card-dark p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Son 7 Günlük Harcama</h4>
          <div className="flex items-end justify-between h-40 gap-2 mb-4 px-2">
            {weeklyData.map((day, idx) => {
              const maxAmount = Math.max(...weeklyData.map(d => d.amount), 1);
              const height = (day.amount / maxAmount) * 100;
              const isPeak = day.amount === maxAmount && day.amount > 0;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-3 group">
                  <div className="relative w-full flex justify-center">
                    <div 
                      className={`w-3 sm:w-4 rounded-t-full transition-all duration-700 ease-out group-hover:w-5 ${isPeak ? 'bg-accent-red shadow-[0_0_15px_rgba(229,115,115,0.4)]' : 'bg-primary/20 group-hover:bg-primary/40'}`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    ></div>
                    {isPeak && (
                      <div className="absolute -top-8 bg-accent-red text-white text-[8px] font-black px-2 py-1 rounded-md animate-bounce">
                        {isPrivateMode ? 'Zirve' : `₺${day.amount.toFixed(0)}`}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] font-black ${isPeak ? 'text-accent-red' : 'text-slate-400'}`}>{day.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-white dark:bg-card-dark p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Aylık Harcama Trendi</h4>
          <div className="relative h-40 w-full">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {monthlyTrend.length > 1 && (() => {
                const max = Math.max(...monthlyTrend.map(d => d.amount), 1);
                const points = monthlyTrend.map((d, i) => `${(i / (monthlyTrend.length - 1)) * 100},${100 - (d.amount / max) * 100}`).join(' ');
                const fillPoints = `0,100 ${points} 100,100`;
                return (
                  <>
                    <polyline points={fillPoints} fill="url(#trendGradient)" stroke="none" />
                    <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" className="text-primary" strokeLinejoin="round" />
                    <circle cx="100" cy={100 - (monthlyTrend[monthlyTrend.length - 1].amount / max) * 100} r="4" fill="white" stroke="currentColor" strokeWidth="2" className="text-primary" />
                  </>
                );
              })()}
            </svg>
          </div>
          <div className="flex justify-between mt-4">
             <span className="text-[9px] font-bold text-slate-400">1 {selectedAbbr}</span>
             <span className="text-[9px] font-bold text-slate-400">Bugün</span>
          </div>
        </section>

        <section className="bg-slate-900 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-white/5 shadow-xl">
           <div className="flex items-start gap-4">
              <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                 <span className="material-symbols-outlined">lightbulb</span>
              </div>
              <div className="space-y-1">
                 <p className="text-xs font-bold text-white/90">Akıllı Analiz Özeti</p>
                 <p className="text-[11px] text-white/50 leading-relaxed">
                   En çok harcama yaptığın gün: <span className="text-accent-red font-black">{visualInsights.maxDay}</span>. 
                   <br />
                   {visualInsights.distributionComment}
                 </p>
              </div>
           </div>
        </section>

        <section className="bg-white dark:bg-card-dark p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Varlık Dağılımı</h3>
            <button onClick={() => setAllocationView(v => v === 'currency' ? 'bank' : 'currency')} className="text-[10px] font-black text-primary uppercase">Görünümü Değiştir</button>
          </div>
          <div className="flex flex-col items-center gap-8">
            <div className="relative size-52 flex items-center justify-center">
              <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                <circle className="text-slate-50 dark:text-slate-800" cx="18" cy="18" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="4.5" />
                {assetAllocation.segments.map((seg, idx) => (
                  <circle key={idx} cx="18" cy="18" r="15.915" fill="transparent" stroke={seg.color} strokeWidth="5.5" strokeDasharray={seg.dashArray} strokeDashoffset={seg.dashOffset} strokeLinecap="round" className="transition-all duration-1000 ease-in-out cursor-pointer hover:stroke-[6.5]" />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h4 className="text-xl font-black tracking-tighter truncate w-full">{formatAmount(assetAllocation.totalWealth)}</h4>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 w-full">
               {assetAllocation.segments.map((seg, idx) => (
                 <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <div className="size-2 rounded-full" style={{ backgroundColor: seg.color }}></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase truncate">{seg.name}</span>
                    <span className="text-[10px] font-black ml-auto">%{seg.percent.toFixed(0)}</span>
                 </div>
               ))}
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Analysis;
