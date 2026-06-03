
import DBService from './dbService';
import { NotificationService } from './notificationService';
import { NotificationType } from '../types';

class ExportService {
  /**
   * Tüm işlemleri CSV formatına dönüştürür ve paylaşım/indirme tetikler.
   */
  static async exportToCSV(): Promise<boolean> {
    try {
      const transactions = DBService.getTransactions();
      if (transactions.length === 0) {
        throw new Error("Dışa aktarılacak işlem bulunamadı.");
      }

      // CSV Başlıkları
      const headers = ["ID", "Tarih", "Başlık", "Kategori", "Miktar", "Para Birimi", "Tip", "İlgili Proje"];
      
      // Veri satırlarını oluştur (Excel dostu olması için noktalı virgül kullanıldı)
      const rows = transactions.map(t => [
        t.id,
        t.date,
        `"${t.title.replace(/"/g, '""')}"`,
        t.category,
        t.amount.toString().replace('.', ','),
        t.currencyType || 'TRY',
        t.type === 'income' ? 'Gelir' : 'Gider',
        t.projectId ? `ProjectID: ${t.projectId}` : "Genel"
      ]);

      // BOM ekleyerek Excel'in Türkçe karakterleri doğru tanımasını sağla
      const csvContent = "\ufeff" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
      const fileName = `FinBot_Dokum_${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      return await this.triggerShareOrDownload(blob, fileName, 'FinBot Finansal Döküm', 'İşte CSV formatındaki finansal dökümün.');
    } catch (error: any) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Tüm uygulama verilerini (Hesaplar, İşlemler, Borçlar, Projeler) JSON olarak yedekler.
   */
  static async backupToJSON(): Promise<boolean> {
    try {
      const backupData = {
        appName: "FinBot AI",
        version: "3.5.0",
        exportDate: new Date().toISOString(),
        tables: {
          transactions: DBService.getTransactions(),
          accounts: DBService.getAccounts(),
          projects: DBService.getProjects(),
          bills: DBService.getBills(),
          history: DBService.getHistory(),
          budgetLimit: DBService.getBudgetLimit()
        }
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `FinBot_Yedek_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([jsonString], { type: 'application/json' });

      return await this.triggerShareOrDownload(blob, fileName, 'FinBot Sistem Yedeği', 'Uygulama verilerinin tam JSON yedeği.');
    } catch (error: any) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Cihazın paylaşım menüsünü açar veya indirme başlatır.
   */
  private static async triggerShareOrDownload(blob: Blob, fileName: string, title: string, text: string): Promise<boolean> {
    const file = new File([blob], fileName, { type: blob.type });

    // 1. Mobil Paylaşım Desteği (WhatsApp, Drive, iCloud vb.)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: title,
          text: text
        });
        return true;
      } catch (err: any) {
        if (err.name === 'AbortError') return false; // Kullanıcı iptal etti
        console.warn("Paylaşım başarısız, indirme yöntemine geçiliyor...");
      }
    }

    // 2. Masaüstü/Fallback İndirme Yöntemi
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

  private static handleError(error: any) {
    console.error("Export/Backup Hatası:", error);
    NotificationService.send(
      "❌ İşlem Başarısız",
      error.message || "Dosya oluşturulurken beklenmedik bir hata oluştu.",
      NotificationType.Alert
    );
  }
}

export default ExportService;
