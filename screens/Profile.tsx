
import React, { useState, useEffect, useRef } from 'react';
import DBService from '../services/dbService';
import { NotificationService } from '../services/notificationService';
import { Screen } from '../types';

interface ProfileProps {
  onScreenChange?: (screen: Screen) => void;
}

const Profile: React.FC<ProfileProps> = ({ onScreenChange }) => {
  // Account States
  const [name, setName] = useState('Caner Aras');
  const [email, setEmail] = useState('caner@finbot.ai');
  const [isEditingName, setIsEditingName] = useState(false);
  const [profileImage, setProfileImage] = useState(`https://i.pravatar.cc/150?u=CanerAras`);
  
  // Preference States
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(document.body.classList.contains('dark'));
  const [language, setLanguage] = useState('Türkçe');
  const [budgetLimit, setBudgetLimit] = useState(DBService.getBudgetLimit());
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync Dark Mode with Body Class
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);
  
  const toggleNotifications = async () => {
    if (!notifications) {
      const granted = await NotificationService.requestPermission();
      if (!granted) {
        alert("Bildirim izni reddedildi. Tarayıcı ayarlarından açabilirsiniz.");
        return;
      }
    }
    setNotifications(!notifications);
  };
  
  const handleLogout = () => {
    if (confirm('Oturumu kapatmak istediğinize emin misiniz?')) {
      // Kalıcı oturum bilgisini temizle
      DBService.setLoggedIn(false);
      // Uygulamayı yeniden başlatarak giriş ekranına (AuthScreen) dönülmesini sağla
      window.location.reload();
    }
  };

  const handleUpdateBudget = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    setBudgetLimit(val);
    DBService.setBudgetLimit(val);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-h-screen overflow-y-auto no-scrollbar bg-slate-50 dark:bg-bg-dark">
      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />

      <header className="p-10 flex flex-col items-center gap-6 bg-gradient-to-b from-primary/10 to-transparent">
        <div className="relative group">
          <div onClick={handleImageClick} className="w-28 h-28 rounded-[2.5rem] border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden relative cursor-pointer rotate-3 transition-transform hover:rotate-0">
            <img src={profileImage} className="w-full h-full object-cover" alt="Profil" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
            </div>
          </div>
          <button onClick={handleImageClick} className="absolute -bottom-2 -right-2 w-10 h-10 bg-secondary text-white rounded-2xl flex items-center justify-center shadow-lg border-4 border-white dark:border-slate-800 active:scale-90 transition-transform">
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
        </div>
        
        <div className="text-center w-full px-4">
          {isEditingName ? (
            <input autoFocus className="text-2xl font-black bg-white dark:bg-slate-800 border-b-4 border-primary outline-none text-center w-full max-w-[240px]" value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setIsEditingName(false)} onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)} />
          ) : (
            <h2 className="text-2xl font-black flex items-center justify-center gap-3">
              {name}
              <button onClick={() => setIsEditingName(true)} className="material-symbols-outlined text-slate-300 text-lg hover:text-primary">edit</button>
            </h2>
          )}
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{email}</p>
        </div>
      </header>

      <div className="px-6 space-y-8">
        
        {/* YILLIK KARNE PROMO */}
        <button 
          onClick={() => onScreenChange?.(Screen.YearlyReport)}
          className="w-full bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 rounded-[3rem] text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden group active:scale-[0.98] transition-all text-left"
        >
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-2">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Rapor Zamanı</span>
               <span className="size-1.5 rounded-full bg-white animate-ping"></span>
             </div>
             <h3 className="text-xl font-black tracking-tight mb-4">2025 Yıllık Finansal<br/>Karneni Gör</h3>
             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <span>Hemen İncele</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
             </div>
          </div>
          <span className="material-symbols-outlined absolute -bottom-6 -right-6 text-9xl opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">stars</span>
        </button>

        {/* Preferences */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Uygulama Tercihleri</h3>
          <div className="bg-white dark:bg-card-dark rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="w-full flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined">notifications</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black">Akıllı Uyarılar</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Anlık Bildirimler</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={notifications} onChange={toggleNotifications} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-100 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:bg-secondary after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
              </label>
            </div>

            <div className="w-full flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <span className="material-symbols-outlined">{darkMode ? 'dark_mode' : 'light_mode'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black">Karanlık Tema</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{darkMode ? 'Neon Aksan' : 'Lacivert Aksan'}</span>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={darkMode} onChange={toggleDarkMode} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-100 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:bg-secondary after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all shadow-inner"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Account & Data */}
        <div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2">Hesap & Veri</h3>
          <div className="bg-white dark:bg-card-dark rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
            <button onClick={() => DBService.exportTransactionsToCSV()} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 text-primary">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                   <span className="material-symbols-outlined">download</span>
                </div>
                <span className="text-sm font-black">Verileri Yedekle (CSV)</span>
              </div>
              <span className="material-symbols-outlined text-slate-300">chevron_right</span>
            </button>
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                   <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined">track_changes</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-sm font-black">Bütçe Limiti (₺)</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Aylık Kritik Eşik</span>
                   </div>
                </div>
                <input 
                  type="number" 
                  value={budgetLimit} 
                  onChange={handleUpdateBudget} 
                  className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-2 text-sm font-black w-28 text-right outline-none focus:ring-2 focus:ring-primary shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 mt-12 pb-10">
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 py-6 text-accent-red font-black text-xs uppercase tracking-widest bg-accent-red/5 rounded-[2rem] border-2 border-accent-red/10 transition-all hover:bg-accent-red hover:text-white active:scale-95">
          <span className="material-symbols-outlined">logout</span> Oturumu Kapat
        </button>
        <p className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 mt-6 uppercase tracking-[0.4em]">FinBot AI v3.0.0</p>
      </div>
    </div>
  );
};

export default Profile;
