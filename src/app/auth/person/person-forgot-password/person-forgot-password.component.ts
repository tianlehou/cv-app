import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FirebaseService } from '../../../services/firebase.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true, // Indica que el componente es standalone
  imports: [CommonModule, ReactiveFormsModule, RouterModule], // Importa los módulos necesarios
  templateUrl: './person-forgot-password.component.html',
  styleUrls: ['./person-forgot-password.component.css'],
})
export class ForgotPasswordComponent {
  forgotPasswordForm: FormGroup;

  constructor(private fb: FormBuilder, private firebaseService: FirebaseService) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  recoverPassword() {
    const email = this.forgotPasswordForm.get('email')?.value;
    if (email) {
      this.firebaseService
        .sendPasswordResetEmail(email)
        .then(() => {
          alert('Enlace de recuperación enviado. Revisa tu correo.');
        })
        .catch((error) => {
          alert('Error al enviar el enlace de recuperación: ' + error.message);
        });
    }
  }
}
