
import React, { useState, useMemo, useEffect } from 'react';
import { INITIAL_BILLS, INITIAL_ACCOUNTS } from '../constants';
import { Bill, Account } from '../types';
import DBService from '../services/dbService';

interface BillManagerProps {
  isPrivateMode?: boolean;
}

const BillManager: React.FC<BillManagerProps> = ({ isPrivateMode = false }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Bill>>({
    name: '',
    amount: 0,
    dueDate: '',
    category: 'Faturalar',
    billType: 'subscription',
    isRecurring: true,
    autoPay: false,
    interestRate: 0,
    totalAmount: 0,
    paidAmount: 0,
    totalInstallments: 1,
    currentInstallment: 0,
    linkedAccountId: ''
  });

  const formatAmount = (val: number) => {
    if (isPrivateMode) return '••••';
    return `₺${val.toLocaleString('tr-TR')}`;
  };

  useEffect(() => {
    const loadedBills = DBService.getBills();
    const loadedAccounts = DBService.getAccounts();
    setAccounts(loadedAccounts.length > 0 ? loadedAccounts : INITIAL_ACCOUNTS);
    
    if (loadedBills.length === 0) {
      INITIAL_BILLS.forEach(b => DBService.saveBill(b));
      setBills(INITIAL_BILLS);
    } else {
      setBills(loadedBills);
    }

    const handleUpdate = () => setBills(DBService.getBills());
    window.addEventListener('bills_updated', handleUpdate);
    return () => window.removeEventListener('bills_updated', handleUpdate);
  }, []);

  const subscriptions = useMemo(() => bills.filter(b => b.billType === 'subscription'), [bills]);
  const debts = useMemo(() => bills.filter(b => b.billType === 'debt'), [bills]);
  
  const totalMonthlyRecurring = subscriptions.reduce((acc, curr) => acc + (curr.isCompleted ? 0 : curr.amount), 0);
  const totalDebt = debts.reduce((acc, curr) => acc + (curr.isCompleted ? 0 : (curr.totalAmount || 0) - (curr.paidAmount || 0)), 0);

  const debtStrategy = useMemo(() => {
    const activeDebts = debts.filter(d => !d.isCompleted);
    if (activeDebts.length === 0) return null;

    const highInterestDebt = [...activeDebts].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0))[0];
    const annualInterestSaving = (highInterestDebt.totalAmount || 0) * ((highInterestDebt.interestRate || 0) / 100);

    return {
      primaryTargetId: highInterestDebt.id,
      avalancheDebt: highInterestDebt,
      savingPotential: annualInterestSaving
    };
  }, [debts]);

  const getDayDiff = (dueDate: string) => {
    const dayMatch = dueDate.match(/\d+/);
    if (!dayMatch) return 100;
    const day = parseInt(dayMatch[0]);
    const today = new Date().getDate();
    return day - today;
  };

  const handleOpenAdd = (type: 'subscription' | 'debt') => {
    setEditingBill(null);
    setFormData({
      name: '',
      amount: 0,
      dueDate: `${new Date().getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][new Date().getMonth()]}`,
      category: type === 'subscription' ? 'Eğlence' : 'Finans',
      billType: type,
      isRecurring: type === 'subscription',
      autoPay: false,
      interestRate: type === 'debt' ? 35 : 0,
      totalAmount: 0,
      paidAmount: 0,
      totalInstallments: type === 'debt' ? 12 : 1,
      currentInstallment: 0,
      linkedAccountId: accounts[0]?.id || ''
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({ ...bill });
    setShowAddModal(true);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Bu ödeme planını silmek istediğinize emin misiniz?')) {
      DBService.deleteBill(id);
    }
  };

  const handleToggleComplete = (bill: Bill, e: React.MouseEvent) => {
    e.stopPropagation();
    const willBeCompleted = !bill.isCompleted;
    DBService.updateBill({ ...bill, isCompleted: willBeCompleted });
    
    if (willBeCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      alert("Tebrikler, bir yükten daha kurtuldun! 🎉");
    }
  };

  const handleSave = () => {
    if (!formData.name || !formData.amount || !formData.dueDate) {
      alert('Lütfen zorunlu alanları doldurun.');
      return;
    }

    const billData: Bill = {
      id: editingBill?.id || Date.now().toString(),
      name: formData.name || '',
      amount: Number(formData.amount),
      dueDate: formData.dueDate || '',
      category: formData.category || 'Diğer',
      autoPay: !!formData.autoPay,
      status: 'pending',
      icon: formData.billType === 'subscription' ? (formData.category === 'Eğlence' ? 'movie' : 'notifications') : 'credit_card',
      color: editingBill?.color || (formData.billType === 'subscription' ? '#006c75' : '#eab308'),
      billType: formData.billType as 'subscription' | 'debt',
      isRecurring: !!formData.isRecurring,
      totalAmount: formData.billType === 'debt' ? Number(formData.totalAmount) : Number(formData.amount),
      paidAmount: formData.billType === 'debt' ? Number(formData.paidAmount) : 0,
      interestRate: formData.billType === 'debt' ? Number(formData.interestRate) : 0,
      isCompleted: editingBill?.isCompleted || false,
      totalInstallments: Number(formData.totalInstallments) || 1,
      currentInstallment: Number(formData.currentInstallment) || 0,
      linkedAccountId: formData.linkedAccountId
    };

    if (editingBill) {
      DBService.updateBill(billData);
    } else {
      DBService.saveBill(billData);
    }
    setShowAddModal(false);
  };

  const ConfettiEffect = () => (
    <div className="fixed inset-0 pointer-events-none z-[110] flex items-center justify-center overflow-hidden">
      {[...Array(20)].map((_, i) => (
        <div 
          key={i} 
          className="absolute size-3 rounded-sm animate-bounce" 
          style={{ 
            backgroundColor: ['#006c75', '#81c784', '#eab308', '#f43f5e'][i % 4],
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-bg-dark pb-32 animate-in fade-in duration-500 overflow-y-auto no-scrollbar scroll-smooth">
      {showConfetti && <ConfettiEffect />}
      
      <header className="px-6 pt-12 pb-6 bg-white dark:bg-bg-dark border-b border-slate-100 dark:border-slate-800 sticky top-0 z-20">
        <h1 className="text-2xl font-black tracking-tight">Finansal Planlama</h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gelecek Tahminleri ve Ödemeler</p>
      </header>

      <main className="p-6 space-y-10">
        
        <section className="relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-3xl rounded-full -top-10 -right-10 opacity-40 animate-pulse"></div>
          <div className="relative bg-white/40 dark:bg-card-dark/60 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-7 shadow-2xl shadow-purple-500/10 overflow-hidden ring-1 ring-white/20">
            <div className="flex items-start gap-4 mb-6">
              <div className="size-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shrink-0 shadow-lg">
                <span className="material-symbols-outlined text-3xl animate-spin-slow">auto_awesome</span>
              </div>
              <div className="space-y-1">
                <h2 className="text-[10px] font-black text-purple-500 uppercase tracking-[0.2em] flex items-center gap-1">
                  ✨ AI Strateji Analizi
                </h2>
                {debtStrategy ? (
                  <p className="text-sm font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                    Avalanche Metodu: Faiz yükünü azaltmak için önce faizi <span className="text-rose-500 font-black">%{debtStrategy.avalancheDebt.interestRate}</span> olan <span className="text-indigo-500 font-black">'{debtStrategy.avalancheDebt.name}'</span> borcuna odaklan. Bu strateji yılda <span className="text-accent-green font-black">{formatAmount(debtStrategy.savingPotential)}</span> faiz tasarrufu sağlar.
                  </p>
                ) : (
                  <p className="text-sm font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                    Borçsuz yaşam! Gelecek tahminlerin %100 pozitif. Birikimlerini 'Girişimler' sekmesinde değerlendirebiliriz.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ödemeler & Abonelikler</h4>
              <button onClick={() => handleOpenAdd('subscription')} className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center active:scale-90 shadow-sm border border-primary/10">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
            <span className="text-[9px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-tighter">{formatAmount(totalMonthlyRecurring)} / Ay</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-6 px-6 pb-4">
            {subscriptions.map((sub) => {
              const diff = getDayDiff(sub.dueDate);
              const isCrit = diff >= 0 && diff <= 2;
              return (
                <div 
                  key={sub.id} 
                  onClick={() => handleOpenEdit(sub)}
                  className={`min-w-[190px] snap-center p-6 rounded-[2.5rem] bg-white dark:bg-card-dark border transition-all relative group cursor-pointer ${sub.isCompleted ? 'opacity-40 grayscale' : isCrit ? 'border-orange-400 ring-4 ring-orange-400/10 shadow-[0_0_20px_rgba(251,146,60,0.2)] animate-pulse' : 'border-slate-100 dark:border-slate-800 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="size-10 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: sub.color }}>
                      <span className="material-symbols-outlined text-xl">{sub.icon}</span>
                    </div>
                    <button onClick={(e) => handleToggleComplete(sub, e)} className={`size-6 rounded-full flex items-center justify-center transition-all ${sub.isCompleted ? 'bg-accent-green text-white shadow-inner' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-xs">{sub.isCompleted ? 'check' : 'radio_button_unchecked'}</span>
                    </button>
                  </div>
                  <h5 className="text-xs font-black truncate mb-1">{sub.name}</h5>
                  <div className="flex items-center gap-2 mb-4">
                    <p className={`text-[10px] font-bold uppercase tracking-tighter ${isCrit ? 'text-orange-500' : 'text-slate-400'}`}>{sub.dueDate}</p>
                    {sub.autoPay && <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Otomatik</span>}
                  </div>
                  <p className="text-lg font-black tracking-tighter">{formatAmount(sub.amount)}</p>
                  
                  <button onClick={(e) => handleDelete(sub.id, e)} className="absolute bottom-6 right-6 p-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Borçlar & Taksitler</h4>
              <button onClick={() => handleOpenAdd('debt')} className="size-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center active:scale-90 shadow-sm border border-secondary/10">
                <span className="material-symbols-outlined text-sm">add</span>
              </button>
            </div>
            <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-3 py-1 rounded-full uppercase tracking-tighter">Kalan: {formatAmount(totalDebt)}</span>
          </div>
          
          <div className="space-y-4">
            {debts.map((debt) => {
              const progress = debt.totalAmount ? (debt.paidAmount || 0) / debt.totalAmount * 100 : 0;
              const isPriority = debtStrategy?.primaryTargetId === debt.id;
              const diff = getDayDiff(debt.dueDate);
              const isCrit = diff >= 0 && diff <= 2;

              return (
                <div 
                  key={debt.id} 
                  onClick={() => handleOpenEdit(debt)}
                  className={`bg-white dark:bg-card-dark p-6 rounded-[2.5rem] border shadow-sm space-y-4 group relative cursor-pointer overflow-hidden transition-all hover:border-primary/30 ${debt.isCompleted ? 'opacity-40 grayscale' : isCrit ? 'border-orange-400 ring-1 ring-orange-400/20' : isPriority ? 'border-indigo-500/50 ring-1 ring-indigo-500/10 shadow-lg shadow-indigo-500/5' : 'border-slate-100 dark:border-slate-800'}`}
                >
                  {isPriority && !debt.isCompleted && (
                    <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-[0.2em] shadow-lg animate-pulse z-10">Stratejik Hedef</div>
                  )}
                  
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-2xl">{debt.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black">{debt.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <p className={`text-[9px] font-bold uppercase tracking-widest ${isCrit ? 'text-orange-500' : 'text-slate-400'}`}>{debt.dueDate}</p>
                           {debt.interestRate && (
                             <span className="text-[8px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded tracking-tighter">%{debt.interestRate} Faiz</span>
                           )}
                           <span className="text-[8px] font-black text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded tracking-widest">{debt.currentInstallment}/{debt.totalInstallments}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-black">{formatAmount(debt.amount)}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Aylık Taksit</p>
                      </div>
                      <button onClick={(e) => handleDelete(debt.id, e)} className="p-2 text-slate-200 hover:text-rose-500 group-hover:text-slate-400 transition-colors">
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.15em] text-slate-400">
                      <span>Anapara Ödenen: %{progress.toFixed(0)}</span>
                      <span className="text-primary">{formatAmount((debt.totalAmount || 0) - (debt.paidAmount || 0))} Kalan</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                      <div className={`h-full transition-all duration-1000 ease-out ${debt.isCompleted ? 'bg-slate-300' : isPriority ? 'bg-indigo-500' : 'bg-primary'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 flex gap-3 z-30 animate-in slide-in-from-bottom-5">
        <button onClick={() => handleOpenAdd('subscription')} className="bg-primary text-white font-black px-6 py-4 rounded-[2rem] shadow-2xl shadow-primary/30 flex items-center gap-2 active:scale-95 transition-transform text-[10px] uppercase tracking-widest">
           <span className="material-symbols-outlined text-sm">notifications</span> Abonelik
        </button>
        <button onClick={() => handleOpenAdd('debt')} className="bg-secondary text-white font-black px-6 py-4 rounded-[2rem] shadow-2xl shadow-secondary/30 flex items-center gap-2 active:scale-95 transition-transform text-[10px] uppercase tracking-widest">
           <span className="material-symbols-outlined text-sm">credit_card</span> Borç/Taksit
        </button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-[3.5rem] p-10 animate-in slide-in-from-bottom-20 duration-500 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
            <h2 className="text-2xl font-black mb-8 tracking-tight">{editingBill ? 'Kaydı Düzenle' : 'Yeni Ödeme Planı'}</h2>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Harcama Başlığı</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-5 text-sm outline-none border-2 border-transparent focus:border-primary/20 transition-all" placeholder="Örn: Ev Kredisi" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Aylık Tutar (₺)</label>
                  <input type="number" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-5 text-sm outline-none" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Ödeme Günü</label>
                  <input type="text" value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-5 text-sm outline-none" placeholder="15 Oca" />
                </div>
              </div>

              {formData.billType === 'debt' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Taksit (Ödenen/Top.)</label>
                      <div className="flex items-center gap-1">
                        <input type="number" value={formData.currentInstallment} onChange={e => setFormData({...formData, currentInstallment: Number(e.target.value)})} className="w-1/2 bg-slate-50 dark:bg-slate-800 rounded-l-[1.5rem] p-5 text-sm text-center outline-none" />
                        <input type="number" value={formData.totalInstallments} onChange={e => setFormData({...formData, totalInstallments: Number(e.target.value)})} className="w-1/2 bg-slate-50 dark:bg-slate-800 rounded-r-[1.5rem] p-5 text-sm text-center outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Yıllık Faiz (%)</label>
                      <input type="number" value={formData.interestRate || ''} onChange={e => setFormData({...formData, interestRate: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[1.5rem] p-5 text-sm outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Toplam Kredi Tutarı (₺)</label>
                    <input type="number" value={formData.totalAmount || ''} onChange={e => setFormData({...formData, totalAmount: Number(e.target.value)})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-5 text-sm outline-none" />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Ödeme Yapılacak Hesap</label>
                <select value={formData.linkedAccountId} onChange={e => setFormData({...formData, linkedAccountId: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 rounded-[2rem] p-5 text-sm outline-none appearance-none">
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.bankName} - {acc.accountName}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/50">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Otomatik Tahsilat</span>
                   <span className="text-[8px] text-slate-400 font-bold">Bakiye yeterli olduğunda ödenir</span>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.autoPay} onChange={e => setFormData({...formData, autoPay: e.target.checked})} className="sr-only peer" />
                    <div className="w-12 h-7 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                 </label>
              </div>

              <button onClick={handleSave} className="w-full bg-primary text-white font-black py-5 rounded-[2rem] shadow-xl shadow-primary/20 mt-4 active:scale-95 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">save_as</span> Planı Kaydet
              </button>
              <button onClick={() => setShowAddModal(false)} className="w-full text-slate-400 text-[10px] font-black uppercase py-2 tracking-[0.2em]">Kapat</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillManager;
