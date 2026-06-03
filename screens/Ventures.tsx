
import React, { useState, useMemo } from 'react';
import { Project, Transaction, Screen } from '../types';
import ExchangeRateService from '../services/exchangeRateService';
import { getTripStats } from '../utils/financeUtils';

interface VenturesProps {
  transactions: Transaction[];
  projects: Project[];
  onProjectAdd: (project: Project) => void;
  onTransactionAdd: (tx: Transaction) => void;
  onScreenChange: (screen: Screen) => void;
  isPrivateMode?: boolean;
}

const Ventures: React.FC<VenturesProps> = ({ transactions, projects, onProjectAdd, onTransactionAdd, onScreenChange, isPrivateMode = false }) => {
  const [selectedTrip, setSelectedTrip] = useState<Project | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  const [newProject, setNewProject] = useState({ 
    name: '', 
    type: 'travel' as 'travel' | 'hustle', 
    budget: '', 
    targetCurrency: 'TRY',
    startDate: '',
    endDate: ''
  });

  const [newExpense, setNewExpense] = useState({
    title: '',
    amount: '',
    currency: 'TRY',
    category: 'Yemek'
  });

  const formatAmount = (val: number) => {
    if (isPrivateMode) return '••••';
    return `₺${val.toLocaleString('tr-TR')}`;
  };

  const handleAddProject = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const trimmedName = newProject.name.trim();
    if (!trimmedName) {
      alert("Lütfen cüzdan/gezi adını giriniz.");
      return;
    }

    const budgetValue = parseFloat(newProject.budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      alert("Lütfen geçerli bir bütçe tutarı giriniz (0'dan büyük bir sayı).");
      return;
    }

    const project: Project = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmedName,
      type: newProject.type,
      budget: budgetValue,
      icon: newProject.type === 'travel' ? 'flight_takeoff' : 'rocket_launch',
      color: newProject.type === 'travel' ? '#006c75' : '#81c784',
      status: 'active',
      createdAt: new Date(),
      startDate: newProject.startDate || new Date().toISOString().split('T')[0],
      endDate: newProject.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetCurrency: newProject.targetCurrency
    };

    try {
      onProjectAdd(project);
      setNewProject({ name: '', type: 'travel', budget: '', targetCurrency: 'TRY', startDate: '', endDate: '' });
      setShowAddModal(false);
    } catch (error) {
      console.error("Hedef cüzdan eklenirken hata oluştu:", error);
      alert("Cüzdan oluşturulamadı, lütfen tekrar deneyin.");
    }
  };

  const handleAddTripExpense = () => {
    if (!selectedTrip || !newExpense.title || !newExpense.amount) return;
    
    const amount = parseFloat(newExpense.amount);
    const tryAmount = ExchangeRateService.convertToTRY(amount, newExpense.currency);
    
    const tx: Transaction = {
      id: Date.now().toString(),
      title: newExpense.title,
      category: newExpense.category,
      amount: -tryAmount,
      originalAmount: amount,
      currencyType: newExpense.currency,
      date: 'Bugün',
      type: 'expense',
      icon: getCategoryIcon(newExpense.category),
      projectId: selectedTrip.id
    };
    
    onTransactionAdd(tx);
    setShowExpenseModal(false);
    setNewExpense({ title: '', amount: '', currency: 'TRY', category: 'Yemek' });
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Ulaşım': return 'directions_car';
      case 'Konaklama': return 'bed';
      case 'Yemek': return 'restaurant';
      default: return 'payments';
    }
  };

  const tripStats = useMemo(() => {
    if (!selectedTrip) return null;
    return getTripStats(selectedTrip, transactions);
  }, [selectedTrip, transactions]);

  const summaryData = useMemo(() => {
    if (!selectedTrip) return null;
    const stats = getTripStats(selectedTrip, transactions);
    const categories: Record<string, number> = {};
    stats.tripTxs.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1]);
  }, [selectedTrip, transactions]);

  if (selectedTrip && !showSummary) {
    return (
      <div className="flex flex-col h-screen bg-slate-50 dark:bg-bg-dark font-manrope overflow-y-auto no-scrollbar pb-32">
        <header className="px-6 pt-12 pb-6 bg-white dark:bg-bg-dark sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSelectedTrip(null)} className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tight truncate max-w-[180px]">{selectedTrip.name}</h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Seyahat Koordinatörü</p>
            </div>
          </div>
          <button onClick={() => setShowSummary(true)} className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined">analytics</span>
          </button>
        </header>

        <main className="p-6 space-y-8">
          <section className="bg-gradient-to-br from-primary to-primary/80 p-8 rounded-[3rem] text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Kalan Gezi Bütçesi</p>
              <h2 className="text-4xl font-black tracking-tighter">{formatAmount(tripStats?.remainingBudget || 0)}</h2>
              <div className="mt-6 flex justify-between items-center bg-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div>
                  <p className="text-[8px] font-bold uppercase opacity-60">Toplam Bütçe</p>
                  <p className="text-sm font-black">{formatAmount(selectedTrip.budget)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-bold uppercase opacity-60">Kalan Gün</p>
                  <p className="text-sm font-black">{tripStats?.remainingDays} Gün</p>
                </div>
              </div>
            </div>
            <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[10rem] opacity-5 rotate-12">flight_takeoff</span>
          </section>

          <section className="bg-white dark:bg-card-dark p-7 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Günlük Harcama Hedefi</h4>
                <p className="text-xl font-black tracking-tighter text-primary">{formatAmount(tripStats?.dailyTarget || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Bugün Harcanan</p>
                <p className={`text-sm font-black ${tripStats && tripStats.spentToday > tripStats.dailyTarget ? 'text-accent-red' : 'text-slate-800 dark:text-white'}`}>
                  {formatAmount(tripStats?.spentToday || 0)}
                </p>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${tripStats && tripStats.spentToday > tripStats.dailyTarget ? 'bg-accent-red' : 'bg-primary'}`} 
                style={{ width: `${Math.min((tripStats?.spentToday || 0) / (tripStats?.dailyTarget || 1) * 100, 100)}%` }}
              ></div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gezi Harcamaları</h4>
              <button onClick={() => setShowExpenseModal(true)} className="size-8 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform">
                <span className="material-symbols-outlined text-xl">add</span>
              </button>
            </div>
            <div className="bg-white dark:bg-card-dark rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              {tripStats?.tripTxs.length ? (
                <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {tripStats.tripTxs.map(tx => (
                    <div key={tx.id} className="p-5 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">{tx.icon}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black truncate max-w-[140px]">{tx.title}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{isPrivateMode ? '••••' : tx.originalAmount} {tx.currencyType}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-slate-900 dark:text-white">{formatAmount(Math.abs(tx.amount))}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center text-slate-300">
                  <span className="material-symbols-outlined text-4xl mb-2">receipt_long</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest">Henüz harcama yok</p>
                </div>
              )}
            </div>
          </section>
        </main>

        {showExpenseModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-[2.5rem] p-8 animate-in slide-in-from-bottom-10">
              <h2 className="text-xl font-bold mb-6">Yeni Gezi Harcaması</h2>
              <div className="space-y-4">
                <input type="text" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none" placeholder="Harcama Açıklaması" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none" placeholder="Tutar" />
                  <select value={newExpense.currency} onChange={e => setNewExpense({...newExpense, currency: e.target.value})} className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none appearance-none">
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none appearance-none">
                  <option value="Ulaşım">Ulaşım</option>
                  <option value="Konaklama">Konaklama</option>
                  <option value="Yemek">Yemek</option>
                  <option value="Eğlence">Eğlence</option>
                </select>
                <button onClick={handleAddTripExpense} className="w-full bg-primary text-white font-black py-4 rounded-3xl shadow-lg active:scale-95 transition-transform">Harcamayı Kaydet</button>
                <button onClick={() => setShowExpenseModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase py-2">İptal</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (showSummary) {
    return (
      <div className="flex flex-col h-screen bg-white dark:bg-bg-dark font-manrope overflow-y-auto no-scrollbar pb-32">
        <header className="px-6 pt-12 pb-6 flex items-center gap-4">
          <button onClick={() => setShowSummary(false)} className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="text-xl font-black tracking-tight">Gezi Özeti</h1>
        </header>
        <main className="p-6 space-y-10">
          <section className="text-center space-y-2">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Toplam Harcanan</p>
             <h2 className="text-4xl font-black tracking-tighter">{formatAmount(tripStats?.totalSpent || 0)}</h2>
             <p className={`text-[10px] font-bold uppercase ${tripStats && tripStats.remainingBudget < 0 ? 'text-accent-red' : 'text-accent-green'}`}>
                Bütçe Durumu: {tripStats && tripStats.remainingBudget < 0 ? 'Bütçe Aşıldı' : 'Bütçe Dahilinde'}
             </p>
          </section>

          <section className="space-y-4">
             <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Kategori Dağılımı</h3>
             <div className="space-y-3">
               {summaryData?.map(([name, amount]) => (
                 <div key={name} className="bg-slate-50 dark:bg-card-dark p-5 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <span className="material-symbols-outlined text-primary">{getCategoryIcon(name)}</span>
                       <span className="text-sm font-bold">{name}</span>
                    </div>
                    <span className="text-sm font-black">{formatAmount(amount)}</span>
                 </div>
               ))}
             </div>
          </section>

          <button onClick={() => { setSelectedTrip(null); setShowSummary(false); }} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">Geziden Çık</button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-bg-dark pb-32 overflow-y-auto no-scrollbar">
      <header className="px-6 pt-12 pb-6 bg-white dark:bg-bg-dark border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-2xl font-black tracking-tight">Aktif Girişimler</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">İzole Edilmiş Mikro Cüzdan Yönetimi</p>
      </header>

      <main className="p-6 space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {projects.map(project => {
            const stats = getTripStats(project, transactions);
            return (
              <div 
                key={project.id} 
                onClick={() => setSelectedTrip(project)}
                className="bg-white dark:bg-card-dark rounded-[2.5rem] p-6 border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform" style={{ backgroundColor: project.color }}>
                      <span className="material-symbols-outlined text-2xl">{project.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{project.name}</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{project.type === 'travel' ? 'Gezi Modu' : 'Mikro Girişim'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">{formatAmount(stats.remainingBudget)}</p>
                    <p className="text-[8px] text-slate-400 font-black uppercase">Kalan Bütçe</p>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min((stats.totalSpent / project.budget) * 100, 100)}%`, backgroundColor: project.color }}></div>
                </div>
              </div>
            );
          })}
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full py-5 bg-white dark:bg-slate-800 text-slate-500 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary hover:text-primary transition-all active:scale-95"
        >
          + Yeni Bir Hedef Oluştur
        </button>
      </main>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-[3rem] p-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Yeni Hedef Cüzdanı</h2>
              <button onClick={() => setShowAddModal(false)} className="size-8 flex items-center justify-center text-slate-400">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2 p-1 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <button onClick={() => setNewProject({...newProject, type: 'travel'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${newProject.type === 'travel' ? 'bg-primary text-white shadow-lg' : 'text-slate-400'}`}>Gezi</button>
                <button onClick={() => setNewProject({...newProject, type: 'hustle'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${newProject.type === 'hustle' ? 'bg-accent-green text-white shadow-lg' : 'text-slate-400'}`}>Girişim</button>
              </div>
              <input type="text" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none" placeholder="Cüzdan Adı (Örn: Paris 2024)" />
              <input type="number" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm outline-none" placeholder="Toplam Bütçe (₺)" />
              
              {newProject.type === 'travel' && (
                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-2">Bitiş Tarihi</label>
                      <input type="date" value={newProject.endDate} onChange={e => setNewProject({...newProject, endDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs outline-none" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-bold text-slate-400 uppercase ml-2">Hedef Kur</label>
                      <select value={newProject.targetCurrency} onChange={e => setNewProject({...newProject, targetCurrency: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-xs outline-none appearance-none">
                         <option value="TRY">TRY</option>
                         <option value="USD">USD</option>
                         <option value="EUR">EUR</option>
                      </select>
                   </div>
                </div>
              )}

              <button 
                type="button"
                onClick={(e) => handleAddProject(e)} 
                className="w-full bg-primary text-white font-black py-4 rounded-3xl shadow-lg mt-2 active:scale-95 transition-transform"
              >
                Koordinatörü Aktifleştir
              </button>
              <button onClick={() => setShowAddModal(false)} className="w-full text-slate-400 text-xs font-bold uppercase py-2">Vazgeç</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ventures;
