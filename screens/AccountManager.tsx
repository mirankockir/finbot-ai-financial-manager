
import React, { useState, useMemo, useRef } from 'react';
import { Account, Screen, NotificationType } from '../types';
import ExchangeRateService from '../services/exchangeRateService';
import DBService, { UserProfileData } from '../services/dbService';
import ExportService from '../services/exportService';
import WalletController from '../services/walletController';
import { NotificationService } from '../services/notificationService';

interface AccountManagerProps {
  accounts: Account[];
  onAccountsChange: (accounts: Account[]) => void;
  onBack: () => void;
  isPrivateMode?: boolean;
  onTogglePrivateMode?: () => void;
}

const AccountManager: React.FC<AccountManagerProps> = ({ accounts, onAccountsChange, onBack, isPrivateMode = false, onTogglePrivateMode }) => {
  const [biometricLock, setBiometricLock] = useState(false);
  const [mainCurrency, setMainCurrency] = useState('TRY');
  const [selectedAccountForAction, setSelectedAccountForAction] = useState<Account | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  
  // Edit & Action States
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editBalanceValue, setEditBalanceValue] = useState('');

  // Profile & Photo States
  const [profile, setProfile] = useState<UserProfileData>(DBService.getUserProfile());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newAccount, setNewAccount] = useState({
    accountName: '',
    bankName: '',
    balance: '',
    currencyType: 'TRY'
  });

  const stats = useMemo(() => {
    const total = ExchangeRateService.calculateTotalWealth(accounts);
    const breakdown = ExchangeRateService.getWealthBreakdown(accounts);
    const transactions = DBService.getTransactions();
    const wallet = WalletController.calculateSummary(transactions, accounts, DBService.getProjects());
    
    let grade = 'B';
    if (wallet.healthScore >= 90) grade = 'A+';
    else if (wallet.healthScore >= 70) grade = 'A';
    else if (wallet.healthScore >= 50) grade = 'B';
    else grade = 'C';

    const segments = [
      { name: 'Nakit (TL)', value: breakdown.cash, color: '#006c75' },
      { name: 'Döviz', value: breakdown.foreign, color: '#2b8cee' },
      { name: 'Yatırım', value: breakdown.investment, color: '#eab308' }
    ].filter(s => s.value > 0);

    let acc = 0;
    const chartSegments = segments.map(s => {
      const percent = total > 0 ? (s.value / total) * 100 : 0;
      const dash = `${percent} ${100 - percent}`;
      const offset = -acc;
      acc += percent;
      return { ...s, dash, offset, percent };
    });

    return { total, grade, chartSegments };
  }, [accounts]);

  const handleUpdateProfile = () => {
    setIsUpdatingProfile(true);
    DBService.setUserProfile(profile);
    setTimeout(() => {
      setIsUpdatingProfile(false);
      NotificationService.send("Profil Güncellendi", "Değişikliklerin başarıyla kaydedildi.", NotificationType.Info);
    }, 800);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImageLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const newProfile = { ...profile, profileImage: reader.result as string };
        setProfile(newProfile);
        DBService.setUserProfile(newProfile);
        setIsImageLoading(false);
        setShowPhotoMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeletePhoto = () => {
    const newProfile = { ...profile, profileImage: '' };
    setProfile(newProfile);
    DBService.setUserProfile(newProfile);
    setShowPhotoMenu(false);
    NotificationService.send("Fotoğraf Silindi", "Profil fotoğrafın başarıyla kaldırıldı.", NotificationType.Info);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAddAccount = () => {
    if (!newAccount.accountName || !newAccount.balance) return;
    const balance = parseFloat(newAccount.balance);
    const account: Account = {
      id: Date.now().toString(),
      accountName: newAccount.accountName,
      bankName: newAccount.bankName || 'Diğer',
      balance,
      currencyType: newAccount.currencyType,
      valueInTRY: ExchangeRateService.convertToTRY(balance, newAccount.currencyType),
      icon: ExchangeRateService.getIconForCurrency(newAccount.currencyType),
      color: '#006c75'
    };
    onAccountsChange([...accounts, account]);
    setNewAccount({ accountName: '', bankName: '', balance: '', currencyType: 'TRY' });
    setShowAddModal(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const success = await ExportService.exportToCSV();
      if (success) {
        NotificationService.send(
          "✅ Döküm Hazır!",
          "İşlem geçmişin başarıyla paketlendi ve paylaşım ekranı açıldı.",
          NotificationType.Info
        );
      }
    } catch (error) {
      console.error("Export hatası:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      const success = await ExportService.backupToJSON();
      if (success) {
        NotificationService.send(
          "☁️ Yedekleme Tamam!",
          "Tüm verilerin JSON formatında yedeklendi.",
          NotificationType.Info
        );
      }
    } catch (error) {
      console.error("Yedekleme hatası:", error);
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatAmount = (val: number, cur: string = 'TRY') => {
    if (isPrivateMode) return '••••';
    return `${val.toLocaleString('tr-TR')} ${cur}`;
  };

  // --- Account Action Handlers ---

  const handleStartEditBalance = () => {
    if (!selectedAccountForAction) return;
    setEditBalanceValue(selectedAccountForAction.balance.toString());
    setIsEditingBalance(true);
  };

  const handleSaveBalance = () => {
    if (!selectedAccountForAction) return;
    const newBalance = parseFloat(editBalanceValue);
    if (isNaN(newBalance)) return;

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === selectedAccountForAction.id) {
        return {
          ...acc,
          balance: newBalance,
          valueInTRY: ExchangeRateService.convertToTRY(newBalance, acc.currencyType)
        };
      }
      return acc;
    });

    onAccountsChange(updatedAccounts);
    NotificationService.send("Bakiye Güncellendi", `${selectedAccountForAction.accountName} hesabı için yeni bakiye kaydedildi.`, NotificationType.Info);
    setSelectedAccountForAction(null);
    setIsEditingBalance(false);
  };

  const handleArchiveAccount = () => {
    if (!selectedAccountForAction) return;
    if (confirm(`${selectedAccountForAction.accountName} hesabını arşivlemek (silmek) istediğinize emin misiniz?`)) {
      const updatedAccounts = accounts.filter(acc => acc.id !== selectedAccountForAction.id);
      onAccountsChange(updatedAccounts);
      NotificationService.send("Hesap Arşivlendi", "Seçili hesap listeden kaldırıldı.", NotificationType.Info);
      setSelectedAccountForAction(null);
    }
  };

  const closeActionSheet = () => {
    setSelectedAccountForAction(null);
    setIsEditingBalance(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-bg-dark animate-in fade-in duration-500 overflow-y-auto no-scrollbar pb-40">
      
      {/* 1. Profil Header Bölümü */}
      <header className="px-8 pt-16 pb-12 bg-white dark:bg-card-dark rounded-b-[4rem] shadow-xl shadow-slate-200/50 dark:shadow-none relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 size-60 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-between mb-10 relative z-10">
          <button onClick={onBack} className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 active:scale-90 transition-all border border-slate-100 dark:border-slate-700">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1 className="text-sm font-black tracking-[0.3em] uppercase opacity-40">Hesap Merkezi</h1>
          <div className="size-11"></div>
        </div>

        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative">
            <div className="size-36 rounded-full border-4 border-slate-50 dark:border-slate-800 shadow-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex items-center justify-center transition-all relative">
              {isImageLoading ? (
                <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              ) : profile.profileImage ? (
                <img src={profile.profileImage} className="size-full object-cover" alt="Profile" />
              ) : (
                <span className="text-4xl font-black text-slate-300 dark:text-slate-500">
                  {getInitials(profile.fullName)}
                </span>
              )}
            </div>

            <button 
              onClick={() => setShowPhotoMenu(true)}
              className="absolute bottom-1 right-1 size-11 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-4 border-white dark:border-card-dark active:scale-90 transition-transform hover:scale-105 z-20"
            >
              <span className="material-symbols-outlined text-xl">photo_camera</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black tracking-tight">{profile.fullName}</h2>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mt-1">@{profile.username}</p>
          </div>
        </div>

        <div className="absolute top-32 right-8">
           <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700 shadow-sm">
              <span className="text-xl font-black text-primary">{stats.grade}</span>
              <span className="text-[7px] font-black uppercase text-slate-400">Puan</span>
           </div>
        </div>
      </header>

      <main className="p-8 space-y-12">
        
        {/* 2. Kişisel Bilgiler Formu */}
        <section className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Kişisel Bilgiler</h4>
          <div className="bg-white dark:bg-card-dark p-8 rounded-[3rem] shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Tam Ad Soyad</label>
              <input 
                type="text" 
                value={profile.fullName} 
                onChange={e => setProfile({...profile, fullName: e.target.value})}
                className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 text-sm font-bold outline-none border border-transparent focus:border-primary/20 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Kullanıcı Adı</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">@</span>
                <input 
                  type="text" 
                  value={profile.username} 
                  onChange={e => setProfile({...profile, username: e.target.value})}
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 pl-8 text-sm font-bold outline-none border border-transparent focus:border-primary/20 transition-all" 
                />
              </div>
            </div>
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400 group-hover:text-primary transition-colors">lock_reset</span>
                <span className="text-sm font-bold">Şifreyi Güncelle</span>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </button>
          </div>
        </section>

        {/* 3. Finansal Cüzdanlarım */}
        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Finansal Cüzdanlarım</h4>
            <div className="flex items-center gap-2">
               <span className="text-[10px] font-black text-slate-900 dark:text-white">{formatAmount(stats.total)}</span>
            </div>
          </div>
          
          <div className="bg-white dark:bg-card-dark p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 flex items-center gap-8 shadow-sm">
            <div className="relative size-24 shrink-0">
              <svg className="size-full transform -rotate-90" viewBox="0 0 36 36">
                <circle className="text-slate-100 dark:text-slate-800" cx="18" cy="18" r="15.915" fill="transparent" stroke="currentColor" strokeWidth="3" />
                {stats.chartSegments.map((seg, i) => (
                  <circle key={i} cx="18" cy="18" r="15.915" fill="transparent" stroke={seg.color} strokeWidth="4" strokeDasharray={seg.dash} strokeDashoffset={seg.offset} strokeLinecap="round" className="transition-all duration-1000" />
                ))}
              </svg>
            </div>
            <div className="grid grid-cols-1 gap-2 flex-1">
               {stats.chartSegments.map((s, i) => (
                 <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="size-2 rounded-full" style={{ backgroundColor: s.color }}></div>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">{s.name.split(' ')[0]}</span>
                    </div>
                    <span className="text-[10px] font-black">%{s.percent.toFixed(0)}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="space-y-3">
            {accounts.map(acc => (
              <div 
                key={acc.id} 
                onClick={() => setSelectedAccountForAction(acc)}
                className="bg-white dark:bg-card-dark p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary shadow-inner">
                    <span className="material-symbols-outlined text-2xl">{acc.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black">{acc.accountName}</h4>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{acc.bankName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black tracking-tighter">{formatAmount(acc.balance, acc.currencyType)}</p>
                  <p className="text-[9px] font-bold text-slate-400">≈ {formatAmount(acc.valueInTRY, 'TRY')}</p>
                </div>
              </div>
            ))}
            <button onClick={() => setShowAddModal(true)} className="w-full py-6 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center gap-3 text-slate-400 hover:text-primary transition-all active:scale-95">
               <span className="material-symbols-outlined">add_card</span>
               <span className="text-[10px] font-black uppercase tracking-widest">Yeni Banka Hesabı Ekle</span>
            </button>
          </div>
        </section>

        {/* 4. Uygulama Ayarları */}
        <section className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Uygulama Ayarları</h4>
          <div className="bg-white dark:bg-card-dark rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-white/5">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center">
                      <span className="material-symbols-outlined">fingerprint</span>
                   </div>
                   <div>
                      <p className="text-sm font-black">Biyometrik Kilit</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">FaceID / Parmak İzi</p>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={biometricLock} onChange={e => setBiometricLock(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                </label>
             </div>

             <div className="flex items-center justify-between p-6 border-b border-slate-50 dark:border-white/5">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center">
                      <span className="material-symbols-outlined">{isPrivateMode ? 'visibility_off' : 'visibility'}</span>
                   </div>
                   <div>
                      <p className="text-sm font-black">Gizli Mod</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Bakiyeleri Maskele</p>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={isPrivateMode} onChange={onTogglePrivateMode} className="sr-only peer" />
                  <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
                </label>
             </div>

             <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
                      <span className="material-symbols-outlined">payments</span>
                   </div>
                   <div>
                      <p className="text-sm font-black">Ana Para Birimi</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Kur Dönüşümü İçin</p>
                   </div>
                </div>
                <select 
                  value={mainCurrency} 
                  onChange={e => setMainCurrency(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-2 text-xs font-black outline-none appearance-none"
                >
                  <option value="TRY">TRY</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
             </div>
          </div>
        </section>

        {/* 5. Veri Yönetimi */}
        <section className="space-y-6">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Veri Yönetimi</h4>
          <div className="grid grid-cols-2 gap-4">
             <button 
                onClick={handleExport} 
                disabled={isExporting}
                className={`bg-white dark:bg-card-dark p-6 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-3 active:scale-95 transition-all ${isExporting ? 'opacity-50' : ''}`}
             >
                <div className={`size-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center ${isExporting ? 'animate-pulse' : ''}`}>
                   <span className="material-symbols-outlined">{isExporting ? 'sync' : 'file_download'}</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  {isExporting ? 'Hazırlanıyor...' : 'Döküm İndir'}
                </p>
             </button>
             <button 
                onClick={handleBackup}
                disabled={isBackingUp}
                className={`bg-white dark:bg-card-dark p-6 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-3 active:scale-95 transition-all ${isBackingUp ? 'opacity-50' : ''}`}
              >
                <div className={`size-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center ${isBackingUp ? 'animate-pulse' : ''}`}>
                   <span className="material-symbols-outlined">{isBackingUp ? 'cloud_upload' : 'cloud_sync'}</span>
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  {isBackingUp ? 'Yedekleniyor...' : 'Bulut Yedekleme'}
                </p>
             </button>
          </div>
        </section>

        <div className="pt-4">
           <button 
             onClick={handleUpdateProfile}
             disabled={isUpdatingProfile}
             className="w-full bg-primary text-white font-black py-6 rounded-[2.5rem] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
           >
             <span className="material-symbols-outlined">{isUpdatingProfile ? 'sync' : 'how_to_reg'}</span>
             {isUpdatingProfile ? 'GÜNCELLENİYOR...' : 'PROFILI GÜNCELLE'}
           </button>
        </div>

      </main>

      {/* Action Sheet: Account Actions */}
      {selectedAccountForAction && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-[3.5rem] p-10 animate-in slide-in-from-bottom-20 duration-500 shadow-2xl">
             <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8"></div>
             
             <div className="flex items-center gap-4 mb-10">
                <div className="size-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                   <span className="material-symbols-outlined text-4xl">{selectedAccountForAction.icon}</span>
                </div>
                <div>
                   <h3 className="text-xl font-black">{selectedAccountForAction.accountName}</h3>
                   <p className="text-xs text-slate-400 font-bold uppercase">{selectedAccountForAction.bankName}</p>
                </div>
             </div>
             
             {isEditingBalance ? (
               <div className="space-y-6 animate-in zoom-in-95">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Yeni Bakiye ({selectedAccountForAction.currencyType})</label>
                    <input 
                      type="number" 
                      value={editBalanceValue} 
                      onChange={e => setEditBalanceValue(e.target.value)}
                      autoFocus
                      className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-lg font-black outline-none border-2 border-primary/20 focus:border-primary"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setIsEditingBalance(false)} className="py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 font-black text-[10px] uppercase">Vazgeç</button>
                    <button onClick={handleSaveBalance} className="py-4 rounded-2xl bg-primary text-white font-black text-[10px] uppercase shadow-lg shadow-primary/20">Kaydet</button>
                 </div>
               </div>
             ) : (
               <div className="space-y-3">
                  <button 
                    onClick={handleStartEditBalance}
                    className="w-full flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black text-sm active:scale-[0.98] transition-all group"
                  >
                     <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">edit_square</span> Bakiyeyi Elle Düzenle
                  </button>
                  <button 
                    onClick={handleArchiveAccount}
                    className="w-full flex items-center gap-4 p-5 bg-rose-500/5 text-rose-500 rounded-2xl font-black text-sm active:scale-[0.98] transition-all group"
                  >
                     <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">archive</span> Hesabı Arşivle
                  </button>
                  <button onClick={closeActionSheet} className="w-full py-6 text-slate-400 font-black text-[10px] uppercase tracking-widest mt-4">Kapat</button>
               </div>
             )}
          </div>
        </div>
      )}

      {/* Modal: Photo Actions */}
      {showPhotoMenu && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-[3.5rem] p-10 animate-in slide-in-from-bottom-20 duration-500 shadow-2xl">
             <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-10"></div>
             <h3 className="text-xl font-black mb-8 text-center">Profil Fotoğrafı</h3>
             <div className="space-y-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-4 p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl group active:scale-95 transition-all"
                >
                   <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined">image_search</span>
                   </div>
                   <div className="text-left">
                      <p className="text-sm font-black">Galeriden Seç</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Yeni bir görsel yükle</p>
                   </div>
                </button>

                <button 
                  onClick={handleDeletePhoto}
                  disabled={!profile.profileImage}
                  className="w-full flex items-center gap-4 p-6 bg-rose-500/5 text-rose-500 rounded-3xl group active:scale-95 transition-all disabled:opacity-30"
                >
                   <div className="size-12 rounded-2xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                      <span className="material-symbols-outlined">delete</span>
                   </div>
                   <div className="text-left">
                      <p className="text-sm font-black">Mevcut Fotoğrafı Sil</p>
                      <p className="text-[10px] opacity-60 font-bold uppercase">Varsayılana geri dön</p>
                   </div>
                </button>

                <button onClick={() => setShowPhotoMenu(false)} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] mt-2">Vazgeç</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal: Change Password */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
             <h3 className="text-2xl font-black mb-8">Şifreyi Güncelle</h3>
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Mevcut Şifre</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Yeni Şifre</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl outline-none" />
                </div>
                <button 
                  onClick={() => setShowPasswordModal(false)}
                  className="w-full bg-primary text-white font-black py-5 rounded-3xl shadow-xl active:scale-95 transition-all"
                >
                  Şifreyi Kaydet
                </button>
                <button onClick={() => setShowPasswordModal(false)} className="w-full text-slate-400 text-[10px] font-black uppercase py-2">Vazgeç</button>
             </div>
          </div>
        </div>
      )}

      {/* Modal: Add Account */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-card-dark rounded-[3.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
             <h2 className="text-2xl font-black mb-8">Yeni Banka Hesabı</h2>
             <div className="space-y-4">
                <input type="text" value={newAccount.bankName} onChange={e => setNewAccount({...newAccount, bankName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm outline-none" placeholder="Banka Adı" />
                <input type="text" value={newAccount.accountName} onChange={e => setNewAccount({...newAccount, accountName: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm outline-none" placeholder="Hesap Etiketi (Maaş vb.)" />
                <div className="grid grid-cols-2 gap-4">
                  <input type="number" value={newAccount.balance} onChange={e => setNewAccount({...newAccount, balance: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm outline-none" placeholder="Bakiye" />
                  <select value={newAccount.currencyType} onChange={e => setNewAccount({...newAccount, currencyType: e.target.value})} className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl text-sm outline-none">
                     <option value="TRY">TRY</option>
                     <option value="USD">USD</option>
                     <option value="EUR">EUR</option>
                  </select>
                </div>
                <button onClick={handleAddAccount} className="w-full bg-primary text-white font-black py-5 rounded-3xl shadow-xl shadow-primary/20 mt-6 active:scale-95 transition-all">Hesabı Kaydet</button>
                <button onClick={() => setShowAddModal(false)} className="w-full py-4 text-slate-400 text-[10px] font-black uppercase">Vazgeç</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManager;
