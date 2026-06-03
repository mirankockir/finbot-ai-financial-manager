
import React, { useEffect, useState, useMemo, useRef } from 'react';
import Gauge from '../components/Gauge';
import HealthMeter from '../components/HealthMeter';
import SmartInsights from '../components/SmartInsights';
import WalletController, { WalletSummary } from '../services/walletController';
import DBService from '../services/dbService';
import ExchangeRateService, { VolatilityStatus } from '../services/exchangeRateService';
import { CATEGORIES, INITIAL_BILLS } from '../constants';
import { Account, Screen, UploadRecord, Transaction, Bill, Project } from '../types';

interface CheckupProps {
  onScreenChange?: (screen: Screen) => void;
  history?: UploadRecord[];
  transactions?: Transaction[];
  accounts?: Account[];
  projects?: Project[];
  onAccountsChange?: (accounts: Account[]) => void;
  onTransactionAdd?: (t: Transaction) => void;
  isPrivateMode?: boolean;
  onTogglePrivateMode?: () => void;
}

const Checkup: React.FC<CheckupProps> = ({ 
  onScreenChange, 
  history = [], 
  transactions = [], 
  accounts = [], 
  projects = [],
  onAccountsChange,
  onTransactionAdd,
  isPrivateMode = false,
  onTogglePrivateMode
}) => {
  const [scrollY, setScrollY] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const wallet = useMemo(() => 
    WalletController.calculateSummary(transactions || [], accounts || [], projects || []),
    [transactions, accounts, projects]
  );

  const volatility = useMemo(() => 
    ExchangeRateService.getVolatilityStatus(accounts || []),
    [accounts]
  );

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) setScrollY(containerRef.current.scrollTop);
    };
    containerRef.current?.addEventListener('scroll', handleScroll);
    
    const checkUnread = () => {
      const all = DBService.getNotifications();
      const count = all.filter(n => !n.isRead).length;
      setUnreadCount(count);
    };

    checkUnread();
    window.addEventListener('notifications_updated', checkUnread);
    
    return () => {
      containerRef.current?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('notifications_updated', checkUnread);
    };
  }, []);

  const getCurrencyStyle = (type: string) => {
    switch (type.toUpperCase()) {
      case 'USD': return 'from-emerald-500 to-teal-700 shadow-emerald-500/20';
      case 'EUR': return 'from-blue-500 to-indigo-700 shadow-blue-500/20';
      case 'GOLD': return 'from-amber-400 to-orange-600 shadow-amber-500/20';
      case 'GBP': return 'from-violet-500 to-purple-800 shadow-purple-500/20';
      default: return 'from-slate-700 to-slate-900 shadow-slate-500/20';
    }
  };

  const formatAmount = (val: number, cur: string = 'TRY') => {
    if (isPrivateMode) return '••••';
    return `${cur === 'TRY' ? '₺' : ''}${val.toLocaleString('tr-TR')}${cur !== 'TRY' ? ` ${cur}` : ''}`;
  };

  return (
    <div ref={containerRef} className="flex flex-col h-screen overflow-y-auto no-scrollbar bg-slate-50 dark:bg-bg-dark font-manrope scroll-smooth">
      <div className="p-6 pt-12 space-y-10 pb-32">
        <section className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black tracking-tight text-primary">Finansal Radar</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Portföy Yönetimi</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Hızlı Gizli Mod Toggle Butonu */}
            <button 
              onClick={onTogglePrivateMode} 
              className={`size-10 rounded-2xl flex items-center justify-center transition-all shadow-sm border active:scale-90 ${
                isPrivateMode 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'
              }`}
              title={isPrivateMode ? "Gizli Modu Kapat" : "Gizli Modu Aç"}
            >
              <span className="material-symbols-outlined text-xl">
                {isPrivateMode ? 'visibility_off' : 'visibility'}
              </span>
            </button>

            <button 
              onClick={() => onScreenChange?.(Screen.Notifications)} 
              className="relative size-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all hover:bg-slate-100 dark:hover:bg-slate-700 group shadow-sm border border-slate-100 dark:border-slate-700"
              aria-label="Bildirimler"
            >
              <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent-red px-1.5 text-[9px] font-black text-white shadow-lg shadow-accent-red/40 border-2 border-white dark:border-slate-800 animate-in zoom-in duration-300">
                  {unreadCount > 9 ? '9+' : unreadCount}
                  <span className="absolute inset-0 rounded-full bg-accent-red animate-ping opacity-25"></span>
                </span>
              )}
            </button>
            <button onClick={() => onScreenChange?.(Screen.Accounts)} className="size-10 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm active:scale-90 transition-all">
              <img src="https://i.pravatar.cc/150?u=CanerAras" className="w-full h-full object-cover" alt="Profil" />
            </button>
          </div>
        </section>

        {volatility && (
          <section className={`p-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top duration-700 border ${
            volatility.direction === 'up' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
          }`}>
            <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              volatility.direction === 'up' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
            }`}>
              <span className="material-symbols-outlined text-xl">
                {volatility.direction === 'up' ? 'trending_up' : 'trending_down'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">FinBot Uyarısı</p>
              <p className="text-xs font-bold leading-tight text-slate-900 dark:text-white">
                <span className="font-black text-primary">{volatility.currency}</span> hareketli! 
                Varlıkların şu an {formatAmount(volatility.impactInTRY, 'TRY')} {volatility.direction === 'up' ? 'değer kazandı' : 'değer kaybetti'}.
              </p>
            </div>
            <span className="text-[10px] font-black text-slate-500 dark:text-slate-300">%{volatility.percentChange.toFixed(1)}</span>
          </section>
        )}

        <section className="bg-gradient-to-br from-primary to-primary/80 p-7 rounded-[2.5rem] shadow-2xl shadow-primary/30 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-2">
               <p className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">Toplam Varlık Değeri</p>
               <span className="material-symbols-outlined text-white/40 text-sm">auto_graph</span>
            </div>
            <div className="flex items-baseline gap-1">
              <h2 className="text-4xl font-black tracking-tighter">{formatAmount(wallet.totalWealth, 'TRY')}</h2>
            </div>
            <div className="mt-6 space-y-2">
               <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-white/60">
                  <span>Varlık Dağılımı</span>
                  <span>%{wallet.totalWealth > 0 ? ((wallet.mainDisposable / wallet.totalWealth) * 100).toFixed(0) : 0} Likidite</span>
               </div>
               <div className="h-1.5 w-full bg-white/10 rounded-full flex overflow-hidden">
                  <div className="h-full bg-white" style={{ width: `${wallet.totalWealth > 0 ? (wallet.breakdown.cash / wallet.totalWealth) * 100 : 0}%` }}></div>
                  <div className="h-full bg-white/40" style={{ width: `${wallet.totalWealth > 0 ? (wallet.breakdown.foreign / wallet.totalWealth) * 100 : 0}%` }}></div>
                  <div className="h-full bg-accent-green" style={{ width: `${wallet.totalWealth > 0 ? (wallet.breakdown.investment / wallet.totalWealth) * 100 : 0}%` }}></div>
               </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 -mr-10 -mt-10 opacity-5">
             <span className="material-symbols-outlined text-[15rem]">finance</span>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Varlıklarım</h4>
            <button onClick={() => onScreenChange?.(Screen.Accounts)} className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-transform active:scale-90">
              <span className="material-symbols-outlined text-xl">manage_accounts</span>
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 pb-2">
            {accounts?.map((account) => (
              <div 
                key={account.id} 
                className={`min-w-[240px] h-[160px] snap-center rounded-[2.5rem] p-6 bg-gradient-to-br ${getCurrencyStyle(account.currencyType)} shadow-xl relative overflow-hidden flex flex-col justify-between transition-transform active:scale-95`}
                onClick={() => onScreenChange?.(Screen.Accounts)}
              >
                <div className="flex justify-between items-start relative z-10">
                  <h5 className="text-[10px] font-black text-white/70 uppercase tracking-widest truncate max-w-[120px]">
                    {account.bankName}
                  </h5>
                  <div className="size-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-lg">{account.icon}</span>
                  </div>
                </div>

                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-white/50 mb-1">{account.accountName}</p>
                  <h4 className="text-2xl font-black text-white tracking-tighter">
                    {formatAmount(account.balance, account.currencyType)}
                  </h4>
                </div>

                <div className="relative z-10 pt-2 border-t border-white/10 flex justify-between items-center">
                   <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter">TRY Karşılığı</span>
                   <span className="text-sm font-black text-white">{formatAmount(account.valueInTRY, 'TRY')}</span>
                </div>

                <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-7xl text-white/10 rotate-12">
                  account_balance
                </span>
              </div>
            ))}
            
            <button 
              onClick={() => onScreenChange?.(Screen.Accounts)}
              className="min-w-[240px] h-[160px] snap-center rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2 group transition-all hover:bg-white dark:hover:bg-slate-800/30"
            >
              <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">add</span>
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Yeni Hesap</span>
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <div className="size-2 rounded-full bg-secondary animate-pulse"></div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Finansal Tahminleme</h4>
          </div>
          <HealthMeter 
            forecastBalance={wallet.forecast} 
            currentBalance={wallet.totalWealth} 
            isNegative={wallet.forecast < 0} 
            isPrivateMode={isPrivateMode}
          />
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stratejik Cüzdanlar</h4>
            <button onClick={() => onScreenChange?.(Screen.Ventures)} className="text-[10px] font-bold text-primary uppercase">Detaylar</button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-card-dark p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-transform active:scale-95" onClick={() => onScreenChange?.(Screen.Ventures)}>
               <span className="material-symbols-outlined text-secondary mb-2">luggage</span>
               <p className="text-[9px] font-bold text-slate-400 uppercase">Seyahat</p>
               <p className="text-sm font-black">{formatAmount(projects.filter(p=>p.type==='travel').reduce((a,c)=>a+c.budget,0))}</p>
            </div>
            <div className="bg-white dark:bg-card-dark p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-transform active:scale-95" onClick={() => onScreenChange?.(Screen.Ventures)}>
               <span className="material-symbols-outlined text-accent-green mb-2">account_tree</span>
               <p className="text-[9px] font-bold text-slate-400 uppercase">Girişim</p>
               <p className="text-sm font-black">{formatAmount(wallet.subWalletTotal)}</p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <span className="material-symbols-outlined text-slate-400 text-sm">bolt</span>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Akıllı Analizler</h4>
          </div>
          <SmartInsights transactions={transactions} bills={INITIAL_BILLS} isPrivateMode={isPrivateMode} />
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Son İşlemler</h4>
            <button onClick={() => onScreenChange?.(Screen.Analysis)} className="text-[10px] font-bold text-primary uppercase">Analiz</button>
          </div>
          <div className="bg-white dark:bg-card-dark rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            {recentTransactions.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-5 flex items-center justify-between transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner">
                        <span className="material-symbols-outlined text-xl">{tx.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate max-w-[140px]">{tx.title}</h4>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{tx.category} • {tx.date}</p>
                      </div>
                    </div>
                    <p className={`text-sm font-black ${tx.type === 'income' ? 'text-accent-green' : 'text-slate-900 dark:text-white'}`}>
                      {tx.type === 'income' ? '+' : ''}{formatAmount(Math.abs(tx.amount), 'TRY')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center flex flex-col items-center">
                <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">history</span>
                <p className="text-xs font-bold text-slate-400">Henüz bir işlem yok.</p>
              </div>
            )}
            <button 
              onClick={() => onScreenChange?.(Screen.Analysis)}
              className="w-full py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800 transition-colors hover:text-primary"
            >
              Tüm Hareketleri Gör
            </button>
          </div>
        </section>
      </div>

      <button onClick={() => onScreenChange?.(Screen.Chat)} className="fixed bottom-24 right-6 size-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center z-50 animate-bounce group active:scale-90 transition-transform">
        <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">smart_toy</span>
      </button>
    </div>
  );
};

export default Checkup;
