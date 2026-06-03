
export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  category: string;
  autoPay: boolean;
  status: 'pending' | 'paid' | 'needs_review';
  icon: string;
  color: string;
  billType: 'subscription' | 'debt';
  isRecurring: boolean;
  totalAmount?: number;
  paidAmount?: number;
  interestRate?: number;
  linkedAccountId?: string;
  isCompleted?: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
}

export interface Project {
  id: string;
  name: string;
  type: 'travel' | 'hustle';
  budget: number;
  icon: string;
  color: string;
  status: 'active' | 'completed';
  createdAt: Date;
  startDate?: string;
  endDate?: string;
  targetCurrency?: string;
}

export interface Transaction {
  id: string;
  title: string;
  category: string;
  categoryId?: string;
  description?: string;
  amount: number;
  originalAmount?: number;
  currencyType?: string;
  date: string;
  type: 'expense' | 'income';
  icon: string;
  isInstallment?: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
  parentTransactionId?: string;
  projectId?: string;
}

export interface Account {
  id: string;
  accountName: string;
  bankName: string;
  balance: number;
  currencyType: string;
  valueInTRY: number;
  icon: string;
  color: string;
}

export enum NotificationType {
  Alert = 'Alert',
  Info = 'Info',
  Tip = 'Tip',
  Reminder = 'Reminder'
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: NotificationType;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  insightData?: any;
}

export interface UploadRecord {
  id: string;
  fileName: string;
  month: string;
  transactionCount: number;
  date: Date;
}

export enum Screen {
  Checkup = 'checkup',
  Analysis = 'analysis',
  Ventures = 'ventures',
  Bills = 'bills',
  Chat = 'chat',
  Profile = 'profile',
  StatementUpload = 'statement_upload',
  Accounts = 'accounts',
  Notifications = 'notifications',
  YearlyReport = 'yearly_report' // Yeni ekran
}
