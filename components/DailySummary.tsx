
import React from 'react';
import { Transaction } from '../types';
import { getTodayTransactions, calculateTodayTotal } from '../utils/financeUtils';

interface DailySummaryProps {
  transactions: Transaction[];
  isPrivateMode?: boolean;
}

const DailySummary: React.FC<DailySummaryProps> = ({ transactions, isPrivateMode = false }) => {
  const todayTxs = getTodayTransactions(transactions);
  const totalToday = calculateTodayTotal(transactions);

  const formatAmount = (val: number) => {
    if (isPrivateMode) return '••••';
    return `₺${val.toLocaleString('tr-TR')}`;
  };

  return (
    <section className="bg-slate-900 dark:bg-slate-900 rounded-[2.5rem] p-7 border border-white/5 shadow-2xl overflow-hidden relative group">
      <div className="absolute top-0 right-0 -mt-8 -mr-8 size-32 bg-primary/20 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/30 transition-colors"></div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Günlük Akış</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-white text-[10px] font-bold uppercase">Bugün:</span>
              <h3 className="text-2xl font-black text-white tracking-tighter">
                {formatAmount(totalToday)}
              </h3>
            </div>
          </div>
          <div className="size-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
            <span className="material-symbols-outlined">today</span>
          </div>
        </div>

        <div className="space-y-4">
          {todayTxs.length > 0 ? (
            todayTxs.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between group/item">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover/item:bg-primary/20 group-hover/item:text-primary transition-all">
                    <span className="material-symbols-outlined text-lg">{tx.icon}</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/90 leading-none mb-1">{tx.title}</p>
                    <p className="text-[9px] font-bold text-white/30 uppercase tracking-tighter">{tx.category} • Az önce</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type === 'income' ? 'text-accent-green' : 'text-white'}`}>
                    {tx.type === 'income' ? '+' : '-'}{formatAmount(Math.abs(tx.amount))}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-4 text-center">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest italic">Bugün henüz bir işlem yok</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DailySummary;
