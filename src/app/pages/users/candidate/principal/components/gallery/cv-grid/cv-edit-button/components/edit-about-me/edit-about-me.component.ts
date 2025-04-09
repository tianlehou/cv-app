import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../../../../../../../shared/services/firebase.service';
import { User } from '@angular/fire/auth';
import { AboutMeInfoComponent } from './about-me-info/about-me-info.component';

@Component({
  selector: 'app-edit-about-me',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, AboutMeInfoComponent],
  templateUrl: './edit-about-me.component.html',
  styleUrls: ['./edit-about-me.component.css'],
})
export class EditAboutMeComponent implements OnInit {
  @Input() currentUser: User | null = null;
  userEmail: string | null = null;
  profileForm!: FormGroup;
  editableFields: { [key: string]: boolean } = {};
  isFormDirty = false;
  originalData: { [key: string]: any } = {};
  showSaveButton = false;
  showInfoComponent = false;

  // Constructor del componente
  constructor(
    private fb: FormBuilder,
    private firebaseService: FirebaseService
  ) {}

  // Método de inicialización del componente
  ngOnInit(): void {
    this.initializeForm();
    this.setEditableFields();

    // Obtener el email del usuario autenticado
    if (this.currentUser && this.currentUser.email) {
      this.userEmail = this.currentUser.email.replace(/\./g, '_');
      this.loadUserData();
    } else {
      console.error('Usuario no autenticado o sin email');
    }

    // Detectar cambios en el formulario
    this.profileForm.valueChanges.subscribe(() => {
      this.isFormDirty = this.profileForm.dirty;

      // Mostrar u ocultar el botón de guardar basado en cambios válidos
      if (this.editableFields['aboutMe']) {
        this.showSaveButton =
          this.isFormDirty &&
          this.profileForm.valid &&
          this.profileForm.get('aboutMe')?.value !==
            this.originalData['aboutMe'];
      }
    });
  }

  // Método para inicializar el formulario
  private initializeForm(): void {
    this.profileForm = this.fb.group({
      aboutMe: [''],
    });
  }

  // Método para establecer los campos editables
  private setEditableFields(): void {
    this.editableFields = {
      aboutMe: false,
    };
  }

  // Método para cargar los datos del usuario
  private async loadUserData(): Promise<void> {
    if (!this.userEmail) {
      console.error('Error: Usuario no autenticado.');
      return;
    }

    try {
      // Obtener datos del usuario
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const aboutMe = userData?.profileData?.aboutMe || '';

      // Cargar datos en el formulario y guardar datos originales
      this.profileForm.patchValue({ aboutMe });
      this.originalData['aboutMe'] = aboutMe; // Guardar datos originales
      this.profileForm.markAsPristine(); // Reinicia el estado "dirty"
      this.isFormDirty = false;
    } catch (error) {
      console.error('Error al cargar los datos del usuario:', error);
    }
  }

  // Método para ajustar la altura del textarea al iniciar
  adjustTextareaHeightOnInit(field: string): void {
    if (field === 'aboutMe') {
      const textarea = document.querySelector(
        'textarea[formControlName="aboutMe"]'
      ) as HTMLTextAreaElement;
      if (textarea) {
        this.adjustTextareaHeight(textarea);
        textarea.addEventListener('input', () =>
          this.adjustTextareaHeight(textarea)
        );
      }
    }
  }

  // Método para ajustar la altura del textarea
  adjustTextareaHeight(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto'; // Restablece la altura
    textarea.style.height = `${textarea.scrollHeight}px`; // Ajusta al contenido
  }

  // Método para alternar el modo de edición
  toggleEdit(field: string): void {
    this.editableFields[field] = !this.editableFields[field];
    if (this.editableFields[field]) {
      // Modo edición activado
      this.showSaveButton = false; // Inicialmente oculto hasta que haya cambios
      setTimeout(() => this.adjustTextareaHeightOnInit(field), 0);
    } else {
      // Cancelar edición, restaurar datos originales
      if (this.originalData[field] !== undefined) {
        this.profileForm.get(field)?.setValue(this.originalData[field]);
        this.profileForm.markAsPristine();
      }
      this.showSaveButton = false; // Ocultar el botón Guardar
    }
  }

  // Método para guardar los cambios
  async onSubmit(): Promise<void> {
    // Verificación en capas para mejor depuración
    if (!this.userEmail) {
      console.error('Intento de guardado sin usuario autenticado');
      alert('Debes iniciar sesión para guardar cambios');
      return;
    }

    // Validación del formulario
    if (!this.profileForm.valid) {
      console.error('Formulario inválido al intentar guardar');
      alert(
        'Por favor completa el campo "Sobre mí" correctamente (mínimo 10 caracteres)'
      );
      return;
    }

    // Verificar si hay cambios reales
    if (
      !this.isFormDirty ||
      this.profileForm.get('aboutMe')?.value === this.originalData['aboutMe']
    ) {
      console.log('Guardado evitado: sin cambios reales');
      return;
    }

    try {
      // Obtener los datos actuales de profileData
      const userData = await this.firebaseService.getUserData(this.userEmail);
      const currentProfileData = userData?.profileData || {};

      // Actualizar únicamente el campo aboutMe
      const updatedProfileData = {
        ...currentProfileData,
        aboutMe: this.profileForm.value.aboutMe,
      };

      // Guardar los datos actualizados en la base de datos
      await this.firebaseService.updateUserData(this.userEmail, {
        profileData: updatedProfileData,
      });

      // Actualizar el estado interno después del guardado exitoso
      this.originalData['aboutMe'] = this.profileForm.value.aboutMe;
      this.profileForm.markAsPristine();
      this.isFormDirty = false;
      this.editableFields['aboutMe'] = false;
      this.showSaveButton = false;

      console.log('Datos guardados exitosamente');
      alert('Tu información se ha guardado correctamente');
    } catch (error) {
      console.error('Error en la operación de guardado:', error);
      alert('Ocurrió un error al guardar. Por favor intenta nuevamente.');
    }
  }

  // método para abrir about-me-info
  openInfoModal(): void {
    this.showInfoComponent = true;
  }

  // método para cerrar about-me-info
  toggleInfoView(): void {
    this.showInfoComponent = !this.showInfoComponent;
  }
}
