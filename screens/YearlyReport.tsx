
import React, { useMemo } from 'react';
import { Transaction, Screen } from '../types';

interface YearlyReportProps {
  transactions: Transaction[];
  onBack: () => void;
}

const YearlyReport: React.FC<YearlyReportProps> = ({ transactions, onBack }) => {
  const yearlyData = useMemo(() => {
    // Son 12 ayın verisini analiz et
    const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Math.abs(t.amount), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // En çok harcama yapılan kategori
    const categoryTotals: Record<string, number> = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Math.abs(t.amount);
    });
    const championCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

    // Karne Notu
    let grade = 'C';
    let color = 'text-orange-500';
    let message = 'İyi bir başlangıç yaptın, daha fazlasını başarabilirsin!';
    
    if (savingsRate > 30) {
      grade = 'A+';
      color = 'text-accent-green dark:text-neon-green';
      message = 'Efsanevi bir yıl! Finansal özgürlük yolunda dev bir adım attın.';
    } else if (savingsRate >= 10) {
      grade = 'B';
      color = 'text-secondary';
      message = 'Harika gidiyorsun! Disiplinini korursan hedeflerine ulaşacaksın.';
    } else if (savingsRate < 0) {
      grade = 'D';
      color = 'text-accent-red';
      message = 'Gelişmen gereken alanlar var. 2026 bütçe planını birlikte yapalım!';
    }

    // Aylık Trend (Mock 12 ay verisi oluşturma - gerçek veri varsa onu kullanır)
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    const trend = months.map(m => {
       const monthTxs = transactions.filter(t => t.date.includes(m));
       const total = monthTxs.reduce((acc, t) => acc + (t.type === 'expense' ? Math.abs(t.amount) : 0), 0);
       return total || Math.random() * 5000 + 1000; // Veri yoksa görsel için mock
    });

    return { income, expense, savings, savingsRate, grade, color, message, championCategory, trend };
  }, [transactions]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-bg-dark font-manrope overflow-y-auto no-scrollbar pb-10 scroll-smooth">
      <header className="px-6 pt-12 pb-6 sticky top-0 z-20 flex items-center justify-between bg-slate-50/80 dark:bg-bg-dark/80 backdrop-blur-md">
        <button onClick={onBack} className="size-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all shadow-sm">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1 className="text-sm font-black tracking-[0.3em] uppercase opacity-40">2025 Finansal Karne</h1>
        <div className="size-10"></div>
      </header>

      <main className="p-6 space-y-8 animate-in fade-in zoom-in-95 duration-700">
        
        {/* Karne Görünümü */}
        <section className="bg-white dark:bg-card-dark rounded-[3rem] p-10 shadow-2xl border-4 border-primary/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 -mr-12 -mt-12 size-40 bg-primary/5 rounded-full"></div>
          
          <div className="text-center space-y-4 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Yıl Sonu Başarı Belgesi</p>
            <h2 className="text-2xl font-black tracking-tight leading-tight">Caner Aras için<br/>Yıllık Finansal Özet</h2>
            
            <div className="py-10">
               <h3 className={`text-8xl font-black ${yearlyData.color} drop-shadow-2xl animate-bounce`}>
                 {yearlyData.grade}
               </h3>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">Finansal Notun</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Toplam Tasarruf</p>
              <h4 className="text-xl font-black text-accent-green dark:text-neon-green">₺{yearlyData.savings.toLocaleString()}</h4>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Tasarruf Oranı</p>
              <h4 className="text-xl font-black">%{yearlyData.savingsRate.toFixed(0)}</h4>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 relative z-10">
             <div className="flex items-start gap-4">
                <div className="size-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 shrink-0">
                   <span className="material-symbols-outlined text-3xl fill-filled">emoji_events</span>
                </div>
                <div>
                   <h5 className="text-sm font-black mb-1">Yılın Şampiyonu: {yearlyData.championCategory ? yearlyData.championCategory[0] : 'Genel'}</h5>
                   <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                     Bu yıl en çok <span className="font-bold text-slate-600 dark:text-slate-200">{yearlyData.championCategory ? yearlyData.championCategory[0] : 'Market'}</span> harcaması yapmışsın. Toplam harcamanın %32'si buraya gitmiş.
                   </p>
                </div>
             </div>
          </div>
        </section>

        {/* Yıllık Harcama Grafiği */}
        <section className="bg-white dark:bg-card-dark p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Yıllık Harcama Trendi</h4>
          <div className="h-40 flex items-end justify-between gap-1">
            {yearlyData.trend.map((val, i) => {
               const max = Math.max(...yearlyData.trend);
               const height = (val / max) * 100;
               return (
                 <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg transition-all hover:bg-primary"
                      style={{ height: `${height}%` }}
                    ></div>
                    <span className="text-[7px] font-black text-slate-400">
                      {['O', 'Ş', 'M', 'N', 'M', 'H', 'T', 'A', 'E', 'E', 'K', 'A'][i]}
                    </span>
                 </div>
               )
            })}
          </div>
        </section>

        {/* Rozetler */}
        <section className="space-y-4">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Yıllık Başarıların</h4>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-card-dark p-6 rounded-[2.5rem] flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                 <div className="size-14 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center mb-3">
                   <span className="material-symbols-outlined text-3xl">workspace_premium</span>
                 </div>
                 <p className="text-[10px] font-black uppercase mb-1">Birikim Ustası</p>
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Gelirinin %20'si Kasada</p>
              </div>
              <div className="bg-white dark:bg-card-dark p-6 rounded-[2.5rem] flex flex-col items-center text-center border border-slate-100 dark:border-slate-800 shadow-sm">
                 <div className="size-14 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mb-3">
                   <span className="material-symbols-outlined text-3xl">verified</span>
                 </div>
                 <p className="text-[10px] font-black uppercase mb-1">Fatura Avcısı</p>
                 <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">Sıfır Gecikme Cezası</p>
              </div>
           </div>
        </section>

        {/* AI Yorum ve Paylaş */}
        <section className="bg-indigo-600 dark:bg-indigo-900/50 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden group">
           <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="size-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                    <span className="material-symbols-outlined animate-bounce">smart_toy</span>
                 </div>
                 <h4 className="text-lg font-black tracking-tight">FinBot'un Yorumu</h4>
              </div>
              <p className="text-sm font-medium leading-relaxed opacity-80">
                "{yearlyData.message} Harika bir yıldı! 2026'da hedeflerine bir adım daha yaklaştın. Seninle gurur duyuyorum."
              </p>
              <button className="w-full bg-white text-indigo-600 font-black py-4 rounded-3xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-indigo-900/20">
                 <span className="material-symbols-outlined">share</span> Karneyi Paylaş
              </button>
           </div>
           <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-[12rem] opacity-5 rotate-12">stars</span>
        </section>

      </main>
    </div>
  );
};

export default YearlyReport;
