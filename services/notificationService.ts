
import { Transaction, NotificationItem, NotificationType, Account, Bill } from '../types';
import DBService from './dbService';
import ExchangeRateService from './exchangeRateService';

export class NotificationService {
  private static triggerInterval: any = null;

  static async requestPermission() {
    if (!("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  static send(title: string, body: string, type: NotificationType = NotificationType.Info) {
    const recent = DBService.getNotifications().slice(0, 5);
    const isDuplicate = recent.some(n => n.title === title && (Date.now() - n.timestamp.getTime() < 3600000));
    
    if (isDuplicate && type !== NotificationType.Alert) return;

    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      title,
      message: body,
      timestamp: new Date(),
      isRead: false,
      type
    };
    DBService.saveNotification(newNotification);

    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }

  static checkUpcomingBillsWithBalance(accounts: Account[]) {
    const today = new Date().getDate();
    const bills = DBService.getBills();

    bills.forEach(bill => {
      if (bill.isCompleted) return;
      
      const dayMatch = bill.dueDate.match(/\d+/);
      if (!dayMatch) return;
      
      const billDay = parseInt(dayMatch[0]);
      // 2 gün kala kontrol et
      if (billDay === today + 2 || billDay === today + 1) {
        const linkedAcc = accounts.find(a => a.id === bill.linkedAccountId);
        
        if (linkedAcc) {
          if (linkedAcc.balance < bill.amount) {
            this.send(
              "🚨 Bakiye Yetersiz!",
              `Yaklaşan '${bill.name}' ödemen için '${linkedAcc.bankName}' hesabında yeterli bakiye yok. Aktarım yapman gerekebilir.`,
              NotificationType.Alert
            );
          }
        }
      }
    });
  }

  static runAllTriggers(transactions: Transaction[], accounts: Account[], limit: number) {
    const status = ExchangeRateService.getVolatilityStatus(accounts);
    if (status && status.percentChange >= 3.0) {
       this.send(`📈 Döviz Alarmı`, `${status.currency} yükseliyor!`, NotificationType.Alert);
    }
    
    this.checkUpcomingBillsWithBalance(accounts);
  }

  static startBackgroundSync(getTransactions: () => Transaction[], getAccounts: () => Account[]) {
    if (this.triggerInterval) return;
    this.triggerInterval = setInterval(() => {
      const txs = getTransactions();
      const accs = getAccounts();
      const limit = DBService.getBudgetLimit();
      this.runAllTriggers(txs, accs, limit);
    }, 300000);
  }
}
