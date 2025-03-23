import { Injectable, inject, runInInjectionContext, EnvironmentInjector } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from '@angular/fire/auth';
import { Database, ref, set, get, update } from '@angular/fire/database';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth = inject(Auth);
  private db = inject(Database);
  private router = inject(Router);
  private authState = new BehaviorSubject<boolean>(false);
  private injector = inject(EnvironmentInjector);

  constructor() {
    this.monitorAuthState();
  }

  private monitorAuthState() {
    runInInjectionContext(this.injector, () => {
      onAuthStateChanged(this.auth, (user) => {
        this.authState.next(!!user);
      });
    });
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  registerWithEmail(email: string, password: string) {
    return runInInjectionContext(this.injector, () => 
      createUserWithEmailAndPassword(this.auth, email, password)
    );
  }

  async loginWithEmail(email: string, password: string) {
    return runInInjectionContext(this.injector, async () => {
      await signInWithEmailAndPassword(this.auth, email, password);
      return this.getCurrentUser();
    });
  }

  sendPasswordResetEmail(email: string) {
    return runInInjectionContext(this.injector, () => 
      sendPasswordResetEmail(this.auth, email)
    );
  }

  saveUserData(email: string, data: { fullName: string; email: string }) {
    return runInInjectionContext(this.injector, () => {
      const userEmailKey = this.formatEmailKey(email);
      const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
      return set(userRef, data);
    });
  }

  isAuthenticated(): Observable<boolean> {
    return this.authState.asObservable();
  }

  async getCurrentUser() {
    return runInInjectionContext(this.injector, async () => {
      const user = this.auth.currentUser;
      if (user?.email) {
        const userEmailKey = this.formatEmailKey(user.email);
        const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
        
        // Corrección clave para línea 81
        const snapshot = await runInInjectionContext(this.injector, () => get(userRef));
        return snapshot.exists() ? snapshot.val() : null;
      }
      return null;
    });
  }

  logout() {
    runInInjectionContext(this.injector, () => this.auth.signOut());
  }

  async getUserData(emailKey: string): Promise<any> {
    return runInInjectionContext(this.injector, async () => {
      const userRef = ref(this.db, `cv-app/users/${emailKey}`);
      try {
        const snapshot = await runInInjectionContext(this.injector, () => get(userRef));
        return snapshot.exists() ? snapshot.val() : null;
      } catch (error) {
        console.error('Error al obtener datos:', error);
        throw error;
      }
    });
  }

  async updateUserData(
    originalEmail: string,
    data: Partial<{
      fullName: string;
      email: string;
      enabled: boolean;
      role: string;
      profileData: {
        phone?: string;
        cedula?: string;
        direction?: string;
        profilePicture?: string;
        experience?: string;
        aboutMe?: string;
      };
    }>
  ): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const userEmailKey = this.formatEmailKey(originalEmail);
      const userRef = ref(this.db, `cv-app/users/${userEmailKey}`);
      try {
        await runInInjectionContext(this.injector, () => update(userRef, data));
        console.log('Datos actualizados exitosamente');
      } catch (error) {
        console.error('Error al actualizar:', error);
        throw error;
      }
    });
  }
}