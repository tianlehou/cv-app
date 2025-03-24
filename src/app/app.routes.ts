import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { HomeComponent } from './pages/home/home.component';

// Auth Section
import { PersonRegisterComponent } from './auth/person/person-register/person-register.component';
import { PersonLoginComponent } from './auth/person/person-login/person-login.component';
import { PersonForgotPasswordComponent } from './auth/person/person-forgot-password/person-forgot-password.component';
import { CompanyRegisterComponent } from './auth/company/company-register/company-register.component';
import { CompanyLoginComponent } from './auth/company/company-login/company-login.component';
import { CompanyForgotPasswordComponent } from './auth/company/company-forgot-password/company-forgot-password.component';

// Admin Section
import { MainComponent } from './pages/users/admin/main.component';

// Company Section

// Person Section
import { ProfileComponent } from './pages/users/person/profile/profile.component';
import { EditProfileComponent } from './pages/users/person/edit-profile/edit-profile.component';

// Others Section
import { SubscriptionComponent } from './pages/subscription/subscription.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },

  // Auth Section
  { path: 'person-register', component: PersonRegisterComponent },
  { path: 'person-login', component: PersonLoginComponent },
  { path: 'person-forgot-password', component: PersonForgotPasswordComponent },
  { path: 'company-register', component: CompanyRegisterComponent },
  { path: 'company-login', component: CompanyLoginComponent },
  { path: 'company-forgot-password', component: CompanyForgotPasswordComponent },

  // Admin Section
  { path: 'main', component: MainComponent, canMatch: [AuthGuard], data: {role: 'admin'}},

  // Person Section
  { path: 'profile', component: ProfileComponent, canMatch: [AuthGuard], data: {role: 'user'}},
  { path: 'edit-profile', component: EditProfileComponent, canMatch: [AuthGuard], data: {role: 'user'}},
 
  // Others Section
  { path: 'suscripciones', component: SubscriptionComponent },
  { path: '**', redirectTo: 'home' },
];
