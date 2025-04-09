import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './pages/home/home.component';

// Auth Section
import { CandidateRegisterComponent } from './auth/candidate/candidate-register/candidate-register.component';
import { CandidateLoginComponent } from './auth/candidate/candidate-login/candidate-login.component';
import { CandidateForgotPasswordComponent } from './auth/candidate/candidate-forgot-password/candidate-forgot-password.component';
import { CompanyRegisterComponent } from './auth/company/company-register/company-register.component';
import { CompanyLoginComponent } from './auth/company/company-login/company-login.component';
import { CompanyForgotPasswordComponent } from './auth/company/company-forgot-password/company-forgot-password.component';

// Admin Section
import { MainComponent } from './pages/users/admin/main.component';

// Company Section

// Person Section
import { ProfileComponent } from './pages/users/candidate/profile/profile.component';
import { PrincipalComponent } from './pages/users/candidate/principal/principal.component';

// Others Section
import { SubscriptionComponent } from './pages/subscription/subscription.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Auth Section
  { path: 'candidate-register', component: CandidateRegisterComponent },
  { path: 'candidate-login', component: CandidateLoginComponent },
  { path: 'candidate-forgot-password', component: CandidateForgotPasswordComponent },
  { path: 'company-register', component: CompanyRegisterComponent },
  { path: 'company-login', component: CompanyLoginComponent },
  { path: 'company-forgot-password', component: CompanyForgotPasswordComponent },

  // Admin Section
  { path: 'main', component: MainComponent, canMatch: [AuthGuard], data: {role: 'admin'}},

  // Person Section
  { path: 'profile', component: ProfileComponent, canMatch: [AuthGuard], data: {role: 'user'}},
  { path: 'principal', component: PrincipalComponent, canMatch: [AuthGuard], data: {role: 'user'}},

  // Others Section
  { path: 'suscripciones', component: SubscriptionComponent },
  { path: '**', redirectTo: 'home' },
];
