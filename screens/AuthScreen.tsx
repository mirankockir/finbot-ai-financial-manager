
import React, { useState, useEffect } from 'react';
import DBService, { UserProfileData } from '../services/dbService';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const registeredUser = DBService.getRegisteredUser();
  const biometricEnabled = registeredUser?.biometricEnabled || false;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Mock network delay
    await new Promise(res => setTimeout(res, 1500));

    if (mode === 'login') {
      const user = DBService.getRegisteredUser();
      // Eğer hiç kullanıcı yoksa (ilk açılış), demo girişine izin ver
      if (!user) {
        if (email === 'demo@finbot.ai' && password === '123456') {
          DBService.setLoggedIn(true);
          onAuthSuccess();
        } else {
          setError('Hatalı giriş! Demo için: demo@finbot.ai / 123456');
        }
      } else {
        if (user.email === email && user.password === password) {
          DBService.setLoggedIn(true);
          onAuthSuccess();
        } else {
          setError('E-posta veya şifre hatalı.');
        }
      }
    } else if (mode === 'signup') {
      if (!acceptTerms) {
        setError('Lütfen kullanım koşullarını onaylayın.');
        setIsLoading(false);
        return;
      }
      const newUser: UserProfileData = {
        fullName,
        username: email.split('@')[0],
        email,
        password,
        profileImage: `https://i.pravatar.cc/150?u=${email}`,
        biometricEnabled: false
      };
      DBService.registerUser(newUser);
      DBService.setLoggedIn(true);
      onAuthSuccess();
    } else {
      alert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.');
      setMode('login');
    }
    setIsLoading(false);
  };

  const handleBiometric = async () => {
    setIsLoading(true);
    // Biyometrik simülasyonu
    await new Promise(res => setTimeout(res, 1000));
    DBService.setLoggedIn(true);
    onAuthSuccess();
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-bg-dark font-manrope animate-in fade-in duration-700">
      
      {/* Header Decoration */}
      <div className="relative h-48 bg-primary overflow-hidden rounded-b-[4rem] flex items-center justify-center">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)]"></div>
         <div className="relative flex flex-col items-center gap-3">
            <div className="size-16 rounded-[2rem] bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xl animate-bounce-subtle">
               <span className="material-symbols-outlined text-white text-4xl">account_balance_wallet</span>
            </div>
            <h1 className="text-white text-xl font-black tracking-widest uppercase">FinBot AI</h1>
         </div>
      </div>

      <main className="flex-1 px-8 -mt-10 relative z-10">
        <div className="bg-white dark:bg-card-dark rounded-[3.5rem] p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-white/5">
          
          <div className="mb-10">
            <h2 className="text-3xl font-black tracking-tight mb-2">
              {mode === 'login' ? 'Hoş Geldin' : mode === 'signup' ? 'Aramıza Katıl' : 'Şifremi Unuttum'}
            </h2>
            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
              {mode === 'login' ? 'Finansal özgürlüğe devam et' : mode === 'signup' ? 'Hesabını oluştur ve yönet' : 'E-posta adresini gir'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl text-xs font-bold border border-rose-100 dark:border-rose-900/30 animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Tam Ad Soyad</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">person</span>
                   <input 
                    type="text" required
                    value={fullName} onChange={e => setFullName(e.target.value)}
                    placeholder="Caner Aras"
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 pl-12 text-sm outline-none border border-transparent focus:border-primary/20 transition-all font-bold" 
                   />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">E-Posta Adresi</label>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">alternate_email</span>
                 <input 
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="caner@finbot.ai"
                  className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 pl-12 text-sm outline-none border border-transparent focus:border-primary/20 transition-all font-bold" 
                 />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Şifre</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 text-xl">lock</span>
                   <input 
                    type={showPassword ? "text" : "password"} required
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 pl-12 pr-12 text-sm outline-none border border-transparent focus:border-primary/20 transition-all font-bold" 
                   />
                   <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 hover:text-primary transition-colors"
                   >
                    {showPassword ? 'visibility_off' : 'visibility'}
                   </button>
                </div>
                {mode === 'login' && (
                  <div className="text-right">
                    <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-primary">Şifremi Unuttum?</button>
                  </div>
                )}
              </div>
            )}

            {mode === 'signup' && (
               <div className="flex items-start gap-3 p-2">
                  <input 
                    type="checkbox" required
                    checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)}
                    className="mt-1 size-5 rounded-lg border-slate-200 text-primary focus:ring-primary" 
                  />
                  <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">
                    <span className="text-primary cursor-pointer">Kullanım Koşullarını</span> ve <span className="text-primary cursor-pointer">Gizlilik Sözleşmesini</span> kabul ediyorum.
                  </p>
               </div>
            )}

            <div className="flex gap-3">
               <button 
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-primary text-white font-black py-5 rounded-[2rem] shadow-xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
               >
                {isLoading ? (
                  <div className="size-5 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                ) : (
                  <>
                    <span className="material-symbols-outlined">{mode === 'login' ? 'login' : mode === 'signup' ? 'how_to_reg' : 'send'}</span>
                    {mode === 'login' ? 'Giriş Yap' : mode === 'signup' ? 'Kayıt Ol' : 'Şifre Gönder'}
                  </>
                )}
               </button>

               {mode === 'login' && biometricEnabled && (
                  <button 
                    type="button"
                    onClick={handleBiometric}
                    className="size-[60px] bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-white/5 active:scale-90 transition-all"
                  >
                    <span className="material-symbols-outlined text-4xl">fingerprint</span>
                  </button>
               )}
            </div>
          </form>

          <div className="mt-10 text-center">
            <button 
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} 
              className="text-xs font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest flex items-center justify-center gap-2 mx-auto group"
            >
              {mode === 'login' ? 'Hesabın yok mu?' : 'Zaten hesabın var mı?'}
              <span className="text-primary group-hover:underline">{mode === 'login' ? 'Kayıt Ol' : 'Giriş Yap'}</span>
            </button>
          </div>

        </div>
      </main>

      <footer className="p-10 text-center">
        <p className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.4em]">Güvenli Şifreleme Aktif</p>
      </footer>

    </div>
  );
};

export default AuthScreen;
