
import React, { useState, useEffect, useRef } from 'react';
import { Screen, Transaction, UploadRecord, Account, Project } from './types';
import Navigation from './components/Navigation';
import Checkup from './screens/Checkup';
import Analysis from './screens/Analysis';
import Ventures from './screens/Ventures';
import BillManager from './screens/BillManager';
import ChatAssistant from './screens/ChatAssistant';
import Profile from './screens/Profile';
import StatementUpload from './screens/StatementUpload';
import AccountManager from './screens/AccountManager';
import NotificationCenter from './screens/NotificationCenter';
import YearlyReport from './screens/YearlyReport'; 
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import { INITIAL_TRANSACTIONS, INITIAL_ACCOUNTS } from './constants';
import DBService from './services/dbService';
import ExchangeRateService from './services/exchangeRateService';
import { NotificationService } from './services/notificationService';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Checkup);
  
  // App Control States
  const [isSplashActive, setIsSplashActive] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState<boolean>(DBService.isFirstTime());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(DBService.isLoggedIn());
  
  // Data States
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const transactionsRef = useRef<Transaction[]>([]);
  const accountsRef = useRef<Account[]>([]);
  const [uploadHistory, setUploadHistory] = useState<UploadRecord[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Global Privacy Mode
  const [isPrivateMode, setIsPrivateMode] = useState<boolean>(() => {
    return localStorage.getItem('isPrivateMode') === 'true';
  });

  const togglePrivateMode = () => {
    setIsPrivateMode(prev => {
      const newState = !prev;
      localStorage.setItem('isPrivateMode', newState.toString());
      window.dispatchEvent(new CustomEvent('balances_visibility_changed'));
      return newState;
    });
  };

  // 1. Service Worker & App Init
  useEffect(() => {
    // PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
          console.log('SW registered: ', registration);
        }).catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
      });
    }

    const initApp = async () => {
      await ExchangeRateService.syncRates();

      let dbTransactions = DBService.getTransactions();
      const dbHistory = DBService.getHistory();
      const dbProjects = DBService.getProjects();
      let dbAccounts = DBService.getAccounts();

      if (dbTransactions.length === 0 && dbHistory.length === 0) {
        INITIAL_TRANSACTIONS.forEach(tx => DBService.saveTransaction(tx));
        dbTransactions = INITIAL_TRANSACTIONS;
        
        if (dbAccounts.length === 0) {
          DBService.setAccounts(INITIAL_ACCOUNTS);
          dbAccounts = INITIAL_ACCOUNTS;
        }
      }

      setTransactions(dbTransactions);
      transactionsRef.current = dbTransactions;
      setUploadHistory(dbHistory);
      setProjects(dbProjects);

      const updatedAccounts = dbAccounts.map(acc => ({
        ...acc,
        valueInTRY: ExchangeRateService.convertToTRY(acc.balance, acc.currencyType)
      }));

      setAccounts(updatedAccounts);
      accountsRef.current = updatedAccounts;
      DBService.setAccounts(updatedAccounts);
      
      setIsLoggedIn(DBService.isLoggedIn());
      setIsFirstTime(DBService.isFirstTime());
      setIsLoaded(true);

      NotificationService.requestPermission();
      NotificationService.startBackgroundSync(
        () => transactionsRef.current,
        () => accountsRef.current
      );

      const limit = DBService.getBudgetLimit();
      NotificationService.runAllTriggers(transactionsRef.current, updatedAccounts, limit);

      setTimeout(() => {
        setIsSplashActive(false);
      }, 2500);
    };

    initApp();
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    transactionsRef.current = transactions;
    accountsRef.current = accounts;
    const limit = DBService.getBudgetLimit();
    NotificationService.runAllTriggers(transactions, accounts, limit);
  }, [transactions, accounts, isLoaded]);

  const handleAddTransaction = (tx: Transaction) => {
    DBService.saveTransaction(tx);
    setTransactions(prev => [tx, ...prev]);
  };

  const handleAddProject = (project: Project) => {
    DBService.saveProject(project);
    setProjects(prev => [project, ...prev]);
  };

  const handleAddStatementData = (newItems: Transaction[], record: UploadRecord) => {
    newItems.forEach(item => DBService.saveTransaction(item));
    DBService.saveHistory(record);
    setTransactions(prev => [...newItems, ...prev]);
    setUploadHistory(prev => [record, ...prev]);
  };

  const handleUpdateAccounts = (newAccounts: Account[]) => {
    const refined = newAccounts.map(acc => ({
      ...acc,
      valueInTRY: ExchangeRateService.convertToTRY(acc.balance, acc.currencyType)
    }));
    DBService.setAccounts(refined);
    setAccounts(refined);
  };

  if (isSplashActive) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-bg-dark font-manrope">
        <div className="relative">
           <div className="size-24 rounded-[2.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 animate-[pulse_2s_infinite]">
              <span className="material-symbols-outlined text-white text-5xl">account_balance_wallet</span>
           </div>
           <div className="absolute inset-0 size-24 bg-primary/20 rounded-[2.5rem] animate-ping opacity-25"></div>
        </div>
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-black tracking-widest text-primary uppercase">FINBOT AI</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em] mt-2">Geleceğin Finans Yönetimi</p>
        </div>
        
        <div className="mt-20 w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
           <div className="h-full bg-primary animate-[slideRight_2.5s_ease-in-out]"></div>
        </div>

        <style>{`
          @keyframes slideRight {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  if (isFirstTime) {
    return <OnboardingScreen onComplete={() => setIsFirstTime(false)} />;
  }

  if (!isLoggedIn) {
    return <AuthScreen onAuthSuccess={() => setIsLoggedIn(true)} />;
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.YearlyReport:
        return <YearlyReport transactions={transactions} onBack={() => setCurrentScreen(Screen.Checkup)} />;
      case Screen.Checkup: 
        return (
          <Checkup 
            onScreenChange={setCurrentScreen} 
            history={uploadHistory} 
            transactions={transactions}
            accounts={accounts}
            projects={projects}
            onAccountsChange={handleUpdateAccounts}
            onTransactionAdd={handleAddTransaction}
            isPrivateMode={isPrivateMode}
            onTogglePrivateMode={togglePrivateMode}
          />
        );
      case Screen.Analysis: 
        return <Analysis transactions={transactions} accounts={accounts} onScreenChange={setCurrentScreen} isPrivateMode={isPrivateMode} />;
      case Screen.Ventures:
        return (
          <Ventures 
            transactions={transactions} 
            projects={projects}
            onProjectAdd={handleAddProject}
            onTransactionAdd={handleAddTransaction} 
            onScreenChange={setCurrentScreen}
            isPrivateMode={isPrivateMode} 
          />
        );
      case Screen.Bills: 
        return <BillManager isPrivateMode={isPrivateMode} />;
      case Screen.Chat: 
        return <ChatAssistant />;
      case Screen.Profile: 
        return <Profile onScreenChange={setCurrentScreen} />;
      case Screen.Accounts:
        return (
          <AccountManager 
            accounts={accounts} 
            onAccountsChange={handleUpdateAccounts} 
            onBack={() => setCurrentScreen(Screen.Checkup)}
            isPrivateMode={isPrivateMode}
            onTogglePrivateMode={togglePrivateMode}
          />
        );
      case Screen.Notifications:
        return (
          <NotificationCenter 
            onBack={() => setCurrentScreen(Screen.Checkup)}
          />
        );
      case Screen.StatementUpload: 
        return (
          <StatementUpload 
            history={uploadHistory}
            accounts={accounts}
            onTransactionAdd={handleAddTransaction}
            onDataProcessed={(data, record) => {
              handleAddStatementData(data, record);
              setCurrentScreen(Screen.Analysis);
            }} 
          />
        );
      default: 
        return <Checkup onScreenChange={setCurrentScreen} history={uploadHistory} transactions={transactions} accounts={accounts} onAccountsChange={handleUpdateAccounts} onTransactionAdd={handleAddTransaction} isPrivateMode={isPrivateMode} onTogglePrivateMode={togglePrivateMode} />;
    }
  };

  return (
    <div className="max-w-md mx-auto h-full relative shadow-2xl overflow-hidden bg-slate-50 dark:bg-bg-dark font-manrope">
      <div className="pb-20 h-full overflow-y-auto no-scrollbar">
        {renderScreen()}
      </div>
      <Navigation currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
    </div>
  );
};

export default App;
