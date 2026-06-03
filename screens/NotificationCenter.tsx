
import React, { useState, useEffect, useMemo } from 'react';
import DBService from '../services/dbService';
import { NotificationItem, NotificationType } from '../types';

interface NotificationCenterProps {
  onBack: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onBack }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    setNotifications(DBService.getNotifications());
  }, []);

  const handleMarkAllRead = () => {
    DBService.markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = (id: string) => {
    DBService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkSingleRead = (id: string) => {
    DBService.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Helper for grouping
  const groupedNotifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: NotificationItem[] } = {
      'Bugün': [],
      'Dün': [],
      'Daha Eski': []
    };

    notifications.forEach(n => {
      const nDate = new Date(n.timestamp);
      nDate.setHours(0, 0, 0, 0);

      if (nDate.getTime() === today.getTime()) {
        groups['Bugün'].push(n);
      } else if (nDate.getTime() === yesterday.getTime()) {
        groups['Dün'].push(n);
      } else {
        groups['Daha Eski'].push(n);
      }
    });

    return groups;
  }, [notifications]);

  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case NotificationType.Alert: 
        return { bg: 'bg-rose-500/10', icon: 'warning', color: 'text-rose-500', label: 'Uyarı' };
      case NotificationType.Reminder: 
        return { bg: 'bg-violet-500/10', icon: 'event_note', color: 'text-violet-500', label: 'Hatırlatıcı' };
      case NotificationType.Tip: 
        return { bg: 'bg-amber-500/10', icon: 'lightbulb', color: 'text-amber-500', label: 'Tavsiye' };
      default: 
        return { bg: 'bg-sky-500/10', icon: 'notifications', color: 'text-sky-500', label: 'Bilgi' };
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-bg-dark animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 bg-white dark:bg-bg-dark border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all active:scale-90"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">Bildirim Merkezi</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Finansal Radar Aktif</p>
          </div>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead} 
            className="text-[10px] font-black text-primary uppercase bg-primary/10 px-4 py-2 rounded-full active:scale-95 transition-all hover:bg-primary hover:text-white"
          >
            Hepsini Oku
          </button>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-32">
        {notifications.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-10 animate-in zoom-in-95 duration-700">
            <div className="relative mb-8">
              <div className="size-32 rounded-full bg-primary/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-7xl text-primary/20">spa</span>
              </div>
              <div className="absolute -top-2 -right-2 size-10 rounded-full bg-accent-green flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-bg-dark">
                <span className="material-symbols-outlined text-xl">done_all</span>
              </div>
            </div>
            <h3 className="text-xl font-black tracking-tight mb-2">Şu an her şey yolunda!</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Tüm bildirimlerini inceledin. Finansal durumun stabil, arkana yaslan ve huzurun tadını çıkar.
            </p>
          </div>
        ) : (
          /* FIX: Explicitly cast Object.entries(groupedNotifications) to [string, NotificationItem[]][] to fix 'unknown' property error */
          (Object.entries(groupedNotifications) as [string, NotificationItem[]][]).map(([groupName, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupName} className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">{groupName}</h2>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                </div>
                
                <div className="space-y-3">
                  {items.map(n => {
                    const config = getTypeConfig(n.type);
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => !n.isRead && handleMarkSingleRead(n.id)}
                        className={`group relative bg-white dark:bg-card-dark rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md active:scale-[0.99] cursor-pointer overflow-hidden ${
                          !n.isRead ? 'border-l-4 border-l-primary' : ''
                        }`}
                      >
                        {/* Status Dot */}
                        {!n.isRead && (
                          <div className="absolute top-5 right-5 size-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(0,108,117,0.5)]"></div>
                        )}

                        <div className="flex gap-4">
                          <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${config.bg} ${config.color}`}>
                            <span className="material-symbols-outlined text-2xl">{config.icon}</span>
                          </div>
                          
                          <div className="flex-1 pr-4">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${config.color}`}>{config.label}</span>
                              <span className="size-1 rounded-full bg-slate-200"></span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                {new Date(n.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <h4 className={`text-sm font-black mb-1 transition-colors ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                              {n.title}
                            </h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        </div>

                        {/* Quick Delete */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(n.id);
                          }}
                          className="absolute -right-12 group-hover:right-4 top-1/2 -translate-y-1/2 size-10 rounded-2xl bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white flex items-center justify-center active:scale-90"
                        >
                          <span className="material-symbols-outlined text-xl">delete_sweep</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* Footer Info */}
      {notifications.length > 0 && (
        <footer className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-6 pointer-events-none">
          <div className="bg-slate-900/5 dark:bg-white/5 backdrop-blur-md py-3 px-6 rounded-full border border-white/10 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-slate-400 text-sm">auto_delete</span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">30 günden eski bildirimler otomatik silinir</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default NotificationCenter;
