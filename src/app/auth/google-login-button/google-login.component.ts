// google-login.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Auth, signInWithPopup, GoogleAuthProvider } from '@angular/fire/auth';
import { FirebaseService } from '../../services/firebase.service';

@Component({
  selector: 'app-google-login',
  standalone: true,
  imports: [RouterModule],
  template: `
    <button class="google-login-btn" (click)="signInWithGoogle()">
      <i class="fab fa-google"></i>
      Continuar con Google
    </button>
  `,
  styles: [
    `
      .google-login-btn {
        width: 100%;
        padding: 10px 15px;
        background-color: #fff;
        color: #757575;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        transition: all 0.3s;
      }

      .google-login-btn:hover {
        background-color: #f8f9fa;
        border-color: #ccc;
      }

      .google-login-btn:active {
        transform: scale(0.98);
      }
    `,
  ],
})
export class GoogleLoginComponent {
  @Output() loginSuccess = new EventEmitter<void>();
  @Output() loginError = new EventEmitter<string>();

  constructor(
    private auth: Auth,
    private router: Router,
    private firebaseService: FirebaseService,
  ) {}

  async signInWithGoogle() {
    try {
      const result = await signInWithPopup(
        this.auth,
        new GoogleAuthProvider()
      ).catch((error) => {
        if (error.code === 'auth/popup-blocked') {
          this.loginError.emit('Permite ventanas emergentes para este sitio');
        }
        throw error;
      });

      const user = result.user;

      if (!user.email) {
        this.loginError.emit('No se pudo obtener el correo de Google');
        return;
      }

      const userData = {
        fullName: user.displayName || 'Usuario Google',
        email: user.email,
        role: 'user',
        enabled: true,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        profileData: {},
      };

      await this.firebaseService.saveUserData(user.email, userData);
      await this.router.navigate(['/profile']);
    } catch (error: any) {
      console.error('Error Google auth:', error);
      this.loginError.emit(
        error.message || 'Error al autenticar con Google. Intenta nuevamente.'
      );
    }
  }
}
