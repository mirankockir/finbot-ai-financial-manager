
export class SecurityService {
  private static MAX_ATTEMPTS = 5;
  private static LOCK_DURATION = 30; // saniye

  static isEnvironmentSecure(): boolean {
    // Cloud Run ve modern tarayıcı ortamları için varsayılan true
    return true;
  }

  static registerFailedAttempt(): number {
    const attempts = parseInt(localStorage.getItem('finbot_auth_attempts') || '0') + 1;
    localStorage.setItem('finbot_auth_attempts', attempts.toString());
    
    if (attempts >= this.MAX_ATTEMPTS) {
      const lockUntil = Date.now() + (this.LOCK_DURATION * 1000);
      localStorage.setItem('finbot_lock_until', lockUntil.toString());
    }
    return attempts;
  }

  static resetFailedAttempts(): void {
    localStorage.removeItem('finbot_auth_attempts');
    localStorage.removeItem('finbot_lock_until');
  }

  static checkLockout(): { isLocked: boolean; remaining: number } {
    const lockUntil = parseInt(localStorage.getItem('finbot_lock_until') || '0');
    const now = Date.now();
    
    if (lockUntil > now) {
      return { isLocked: true, remaining: Math.ceil((lockUntil - now) / 1000) };
    }
    
    if (lockUntil > 0 && lockUntil <= now) {
      this.resetFailedAttempts();
    }
    
    return { isLocked: false, remaining: 0 };
  }

  static async encrypt(data: string): Promise<string> {
    // Client-side basit şifreleme simülasyonu
    return btoa(data);
  }

  static async decrypt(data: string): Promise<string> {
    return atob(data);
  }
}
