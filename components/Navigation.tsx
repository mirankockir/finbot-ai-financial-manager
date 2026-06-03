
import React from 'react';
import { Screen } from '../types';

interface NavigationProps {
  currentScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentScreen, onScreenChange }) => {
  const tabs = [
    { id: Screen.Checkup, icon: 'home', label: 'Ana Sayfa' },
    { id: Screen.Analysis, icon: 'pie_chart', label: 'Analiz' },
    { id: Screen.StatementUpload, icon: 'add_circle', label: 'Ekle' },
    { id: Screen.Bills, icon: 'account_balance_wallet', label: 'Faturalar' },
    { id: Screen.Chat, icon: 'smart_toy', label: 'Sohbet' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 dark:bg-card-dark/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 pb-6 pt-3 flex justify-around items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onScreenChange(tab.id)}
          className={`flex flex-col items-center gap-1 transition-all min-w-[56px] ${
            currentScreen === tab.id ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <span className={`material-symbols-outlined text-2xl ${currentScreen === tab.id ? 'fill-filled' : ''}`}>
            {tab.icon}
          </span>
          <p className="text-[9px] font-bold uppercase tracking-tighter">{tab.label}</p>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
