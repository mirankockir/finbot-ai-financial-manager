
import { UserProfileData } from './dbService';

/**
 * GoogleAuthService: Google Identity Services (GSI) yönetim merkezi.
 */
export class GoogleAuthService {
  /**
   * Cloud Run veya Yerel ortamdaki CLIENT_ID kontrolü.
   * process.env üzerinden beslenmiyorsa placeholder kullanılır.
   */
  private static CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

  private static isIdConfigured(): boolean {
    return this.CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com' && this.CLIENT_ID.includes('.apps.googleusercontent.com');
  }

  static decodeJwt(token: string) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("JWT Decode Error:", e);
      return null;
    }
  }

  /**
   * Başlangıçta hatayı yakalayan ve simülasyona düşen login akışı.
   */
  static initGoogleLogin(callback: (user: UserProfileData | null, error?: string) => void) {
    try {
      // 1. Simülasyon Modu (Eksik Config)
      if (!this.isIdConfigured()) {
        console.warn("FinBot: Google Client ID yapılandırılmadı. Güvenli simülasyon modu devrede.");
        
        setTimeout(() => {
          const mockUser: UserProfileData = {
            fullName: 'Demokan Demoğlu',
            username: 'demo_user',
            email: 'demo@finbot.ai',
            profileImage: 'https://i.pravatar.cc/150?u=demo',
            password: 'GOOGLE_AUTH_SIMULATED',
            biometricEnabled: true
          };
          (mockUser as any).idToken = 'simulated_jwt_token';
          callback(mockUser);
        }, 1500);
        return;
      }

      // 2. Gerçek Google Login Akışı
      if (!(window as any).google) {
        throw new Error("Google GSI script not found");
      }

      (window as any).google.accounts.id.initialize({
        client_id: this.CLIENT_ID,
        callback: (response: any) => {
          if (response.credential) {
            const payload = this.decodeJwt(response.credential);
            if (payload) {
              const googleUser: UserProfileData = {
                fullName: payload.name,
                username: payload.email.split('@')[0],
                email: payload.email,
                profileImage: payload.picture,
                password: `GOOGLE_AUTH_${payload.sub}`, 
                biometricEnabled: true
              };
              (googleUser as any).idToken = response.credential;
              callback(googleUser);
            } else {
              callback(null, "Profil bilgileri decode edilemedi.");
            }
          } else {
            callback(null, "Credential alınamadı.");
          }
        },
      });

      (window as any).google.accounts.id.prompt();
    } catch (e) {
      console.error("Google Auth Initialization Failed:", e);
      callback(null, "Google servisleri şu an kullanılamıyor, lütfen klasik girişi deneyin.");
    }
  }

  static triggerPopup() {
    if (!this.isIdConfigured()) return;
    try {
      (window as any).google.accounts.id.renderButton(
        document.getElementById("googleBtnRef"),
        { theme: "outline", size: "large", width: "100%", text: "continue_with", shape: "pill" }
      );
    } catch (err) {
      console.error("Button render error:", err);
    }
  }
}
