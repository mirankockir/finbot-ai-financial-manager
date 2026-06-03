
import { Transaction, Account, UploadRecord, Project, NotificationItem, Bill } from '../types';

const DB_KEYS = {
  TRANSACTIONS: 'finbot_transactions',
  ACCOUNTS: 'finbot_accounts',
  HISTORY: 'finbot_history',
  BUDGET_LIMIT: 'finbot_budget_limit',
  PROJECTS: 'finbot_projects',
  NOTIFICATIONS: 'finbot_notifications',
  BILLS: 'finbot_bills',
  USER_PROFILE: 'finbot_user_profile',
  IS_LOGGED_IN: 'finbot_is_logged_in',
  REGISTERED_USER: 'finbot_registered_user',
  IS_FIRST_TIME: 'finbot_is_first_time'
};

export interface UserProfileData {
  fullName: string;
  username: string;
  profileImage: string;
  email?: string;
  password?: string;
  biometricEnabled?: boolean;
}

class DBService {
  private static notifyChange(key: string) {
    window.dispatchEvent(new CustomEvent(`${key}_updated`));
  }

  // --- Onboarding ---
  static isFirstTime(): boolean {
    const val = localStorage.getItem(DB_KEYS.IS_FIRST_TIME);
    return val === null; // Eğer hiç set edilmediyse ilk kez giriyordur
  }

  static setOnboardingComplete(): void {
    localStorage.setItem(DB_KEYS.IS_FIRST_TIME, 'false');
  }

  // --- Auth ---
  static isLoggedIn(): boolean {
    return localStorage.getItem(DB_KEYS.IS_LOGGED_IN) === 'true';
  }

  static setLoggedIn(status: boolean): void {
    localStorage.setItem(DB_KEYS.IS_LOGGED_IN, status.toString());
  }

  static getRegisteredUser(): UserProfileData | null {
    const data = localStorage.getItem(DB_KEYS.REGISTERED_USER);
    return data ? JSON.parse(data) : null;
  }

  static registerUser(user: UserProfileData): void {
    localStorage.setItem(DB_KEYS.REGISTERED_USER, JSON.stringify(user));
    // Default profile set
    this.setUserProfile({
      fullName: user.fullName,
      username: user.username,
      profileImage: user.profileImage
    });
  }

  // --- User Profile ---
  static getUserProfile(): UserProfileData {
    const data = localStorage.getItem(DB_KEYS.USER_PROFILE);
    return data ? JSON.parse(data) : {
      fullName: 'Caner Aras',
      username: 'caner_aras',
      profileImage: 'https://i.pravatar.cc/150?u=CanerAras'
    };
  }

  static setUserProfile(profile: UserProfileData): void {
    localStorage.setItem(DB_KEYS.USER_PROFILE, JSON.stringify(profile));
    this.notifyChange('user_profile');
  }

  // --- Bills ---
  static getBills(): Bill[] {
    const data = localStorage.getItem(DB_KEYS.BILLS);
    return data ? JSON.parse(data) : [];
  }

  static saveBill(bill: Bill): void {
    const bills = this.getBills();
    bills.unshift(bill);
    localStorage.setItem(DB_KEYS.BILLS, JSON.stringify(bills));
    this.notifyChange('bills');
  }

  static updateBill(updated: Bill): void {
    const bills = this.getBills().map(b => b.id === updated.id ? updated : b);
    localStorage.setItem(DB_KEYS.BILLS, JSON.stringify(bills));
    this.notifyChange('bills');
  }

  static deleteBill(id: string): void {
    const bills = this.getBills().filter(b => b.id !== id);
    localStorage.setItem(DB_KEYS.BILLS, JSON.stringify(bills));
    this.notifyChange('bills');
  }

  // --- Notifications ---
  static getNotifications(): NotificationItem[] {
    const data = localStorage.getItem(DB_KEYS.NOTIFICATIONS);
    if (!data) return [];
    return JSON.parse(data).map((n: any) => ({
      ...n,
      timestamp: new Date(n.timestamp)
    }));
  }

  static saveNotification(notification: NotificationItem): void {
    const notifications = this.getNotifications();
    notifications.unshift(notification);
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notifyChange('notifications');
  }

  static markAllNotificationsAsRead(): void {
    const notifications = this.getNotifications().map(n => ({ ...n, isRead: true }));
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notifyChange('notifications');
  }

  static deleteNotification(id: string): void {
    const notifications = this.getNotifications().filter(n => n.id !== id);
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notifyChange('notifications');
  }

  static markAsRead(id: string): void {
    const notifications = this.getNotifications().map(n => 
      n.id === id ? { ...n, isRead: true } : n
    );
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    this.notifyChange('notifications');
  }

  // --- Projects ---
  static getProjects(): Project[] {
    const data = localStorage.getItem(DB_KEYS.PROJECTS);
    return data ? JSON.parse(data) : [];
  }

  static saveProject(project: Project): void {
    const projects = this.getProjects();
    projects.unshift(project);
    localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(projects));
  }

  static updateProject(updated: Project): void {
    const projects = this.getProjects().map(p => p.id === updated.id ? updated : p);
    localStorage.setItem(DB_KEYS.PROJECTS, JSON.stringify(projects));
  }

  // --- Transactions ---
  static getTransactions(): Transaction[] {
    const data = localStorage.getItem(DB_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  }

  static saveTransaction(transaction: Transaction): void {
    const transactions = this.getTransactions();
    transactions.unshift(transaction);
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static deleteTransaction(id: string): void {
    const transactions = this.getTransactions().filter(t => t.id !== id);
    localStorage.setItem(DB_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  // --- Accounts ---
  static getAccounts(): Account[] {
    const data = localStorage.getItem(DB_KEYS.ACCOUNTS);
    return data ? JSON.parse(data) : [];
  }

  static setAccounts(accounts: Account[]): void {
    localStorage.setItem(DB_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }

  // --- History ---
  static getHistory(): UploadRecord[] {
    const data = localStorage.getItem(DB_KEYS.HISTORY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return parsed.map((item: any) => ({
      ...item,
      date: new Date(item.date)
    }));
  }

  static saveHistory(record: UploadRecord): void {
    const history = this.getHistory();
    history.unshift(record);
    localStorage.setItem(DB_KEYS.HISTORY, JSON.stringify(history));
  }

  static getBudgetLimit(): number {
    const limit = localStorage.getItem(DB_KEYS.BUDGET_LIMIT);
    return limit ? parseFloat(limit) : 20000;
  }

  static setBudgetLimit(limit: number): void {
    localStorage.setItem(DB_KEYS.BUDGET_LIMIT, limit.toString());
  }

  static async backupToCloud(): Promise<boolean> {
    const backupData = {
      version: '3.0.0',
      timestamp: new Date().toISOString(),
      data: {
        transactions: this.getTransactions(),
        accounts: this.getAccounts(),
        projects: this.getProjects(),
        bills: this.getBills(),
        history: this.getHistory(),
        budgetLimit: this.getBudgetLimit(),
        userProfile: this.getUserProfile()
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `FinBot_CloudBackup_${new Date().toISOString().split('T')[0]}.json`;
    const blob = new Blob([jsonString], { type: 'application/json' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/json' })] })) {
      try {
        const file = new File([blob], fileName, { type: 'application/json' });
        await navigator.share({
          files: [file],
          title: 'FinBot Bulut Yedekleme',
          text: 'Tüm finansal verilerim yedeklendi.'
        });
        return true;
      } catch (err) {
        console.error("Bulut paylaşım hatası:", err);
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
    
    return true;
  }

  static async exportTransactionsToCSV(): Promise<boolean> {
    const transactions = this.getTransactions();
    if (transactions.length === 0) {
      alert("Dışa aktarılacak işlem bulunamadı.");
      return false;
    }

    const headers = ["Tarih", "Başlık", "Kategori", "Miktar", "Para Birimi", "Tip", "Proje"];
    const rows = transactions.map(t => [
      t.date,
      `"${t.title.replace(/"/g, '""')}"`,
      t.category,
      t.amount.toString().replace('.', ','),
      t.currencyType || 'TRY',
      t.type === 'income' ? 'Gelir' : 'Gider',
      t.projectId || "Genel"
    ]);

    const csvContent = "\ufeff" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const fileName = `FinBot_Dokum_${new Date().toISOString().split('T')[0]}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'text/csv' })] })) {
      try {
        const file = new File([blob], fileName, { type: 'text/csv' });
        await navigator.share({
          files: [file],
          title: 'FinBot Finansal Döküm',
          text: 'İşte son finansal dökümün.'
        });
        return true;
      } catch (err) {
        console.error("Paylaşım hatası:", err);
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
    return true;
  }

  static clearAll(): void {
    Object.values(DB_KEYS).forEach(key => localStorage.removeItem(key));
  }
}

export default DBService;
