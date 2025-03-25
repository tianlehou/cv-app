import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-edit-personal-data',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-personal-data.component.html',
  styleUrls: ['./edit-personal-data.component.css'],
})
export class EditPersonalDataComponent implements OnInit {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmail: string | null = null;
  editableFields: { [key: string]: boolean } = {};

  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();
    if (this.currentUser) {
      this.userEmail = this.currentUser.email?.replaceAll('.', '_') || null;
      this.loadUserData();
    }
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      cedula: ['', [Validators.required]],
      phone: ['', Validators.pattern('^\\+?[1-9]\\d{1,14}$')],
      direction: [''],
    });
  }

  private setEditableFields(): void {
    this.editableFields = {
      fullName: false,
      cedula: false,
      phone: false,
      direction: false,
    };
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmail) return;

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      this.profileForm.patchValue({
        fullName: userData?.fullName || '',
        cedula: userData?.profileData?.personalData?.cedula || '',
        phone: userData?.profileData?.personalData?.phone || '',
        direction: userData?.profileData?.personalData?.direction || '',
      });
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  toggleEdit(field: string): void {
    this.editableFields[field] = !this.editableFields[field];
    if (!this.editableFields[field]) this.onSubmit();
  }

  async onSubmit(): Promise<void> {
    if (!this.profileForm.valid || !this.userEmail) {
      alert('Error en los datos o usuario no autenticado.');
      return;
    }

    try {
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const updatedData = {
        ...userData,
        fullName: this.profileForm.value.fullName,
        profileData: {
          ...userData?.profileData,
          personalData: {
            cedula: this.profileForm.value.cedula,
            phone: this.profileForm.value.phone,
            direction: this.profileForm.value.direction,
          }
        }
      };

      await this.firebaseService.updateUserData(this.userEmail, updatedData);
      alert('Datos actualizados exitosamente!');
      await this.loadUserData();
    } catch (error) {
      console.error('Update error:', error);
      alert('Error al guardar los datos');
    }
  }
}