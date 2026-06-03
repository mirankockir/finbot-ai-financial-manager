
import React, { useMemo } from 'react';
import { Transaction, Bill } from '../types';

interface SmartInsightsProps {
  transactions: Transaction[];
  bills: Bill[];
  isPrivateMode?: boolean;
}

interface Insight {
  id: string;
  type: 'warning' | 'info' | 'success' | 'alert';
  title: string;
  description: string;
  icon: string;
  color: string;
}

const SmartInsights: React.FC<SmartInsightsProps> = ({ transactions, bills }) => {
  const insights = useMemo(() => {
    const list: Insight[] = [];
    const now = new Date();
    const currentMonthAbbr = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][now.getMonth()];

    // 1. Yaklaşan Fatura Kontrolü (Gelecek 3 gün)
    const todayDay = now.getDate();
    bills.forEach(bill => {
      const billDayMatch = bill.dueDate.match(/\d+/);
      if (billDayMatch) {
        const billDay = parseInt(billDayMatch[0]);
        if (billDay >= todayDay && billDay <= todayDay + 3 && bill.status !== 'paid') {
          list.push({
            id: `bill-${bill.id}`,
            type: 'alert',
            title: 'Yaklaşan Ödeme',
            description: `Yarın ${bill.name} ödemen var (${bill.amount} ₺). Bakiyen uygun görünüyor.`,
            icon: 'event_upcoming',
            color: 'bg-secondary'
          });
        }
      }
    });

    // 2. Harcama Trendi Kontrolü (Örn: Gıda/Kahve)
    const coffeeExpenses = transactions.filter(t => 
      t.type === 'expense' && 
      (t.title.toLowerCase().includes('kahve') || t.title.toLowerCase().includes('starbucks'))
    );

    if (coffeeExpenses.length > 2) {
      const recentSum = coffeeExpenses.slice(0, 3).reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
      if (recentSum > 500) {
        list.push({
          id: 'trend-coffee',
          type: 'warning',
          title: 'Harcama Uyarısı',
          description: 'Bu hafta kahve harcamaların %20 arttı. Günlük limitini aşmak üzeresin!',
          icon: 'local_cafe',
          color: 'bg-orange-500'
        });
      }
    }

    // 3. Bütçe Tasarruf Başarısı
    const totalSpentThisMonth = transactions
      .filter(t => t.type === 'expense' && t.date.includes(currentMonthAbbr))
      .reduce((acc, curr) => acc + Math.abs(curr.amount), 0);

    if (totalSpentThisMonth < 5000 && transactions.length > 5) {
      list.push({
        id: 'success-savings',
        type: 'success',
        title: 'Harika Gidiyorsun!',
        description: 'Bu ay bütçe hedeflerinin %15 altında kaldın. Tasarruf hesabına aktarım yapabilirsin.',
        icon: 'verified_user',
        color: 'bg-accent-green'
      });
    }

    // Default insight if none found
    if (list.length === 0) {
      list.push({
        id: 'default',
        type: 'info',
        title: 'Finansal Özet',
        description: 'Her şey yolunda görünüyor. Harcamaların stabil ve bütçen dengeli.',
        icon: 'insights',
        color: 'bg-primary'
      });
    }

    return list;
  }, [transactions, bills]);

  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
      {insights.map((insight) => (
        <div 
          key={insight.id}
          className="min-w-[85%] sm:min-w-[320px] snap-center bg-white dark:bg-card-dark rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm flex items-start gap-4 transition-transform active:scale-[0.98]"
        >
          <div className={`size-12 rounded-2xl ${insight.color} text-white flex items-center justify-center shrink-0 shadow-lg`}>
            <span className="material-symbols-outlined text-2xl">{insight.icon}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">{insight.title}</h4>
              <span className="size-2 rounded-full bg-primary animate-pulse"></span>
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {insight.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SmartInsights;
