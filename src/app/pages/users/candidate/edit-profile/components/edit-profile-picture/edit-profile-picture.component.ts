import { FormGroup, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  Input,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage'; // Añadir deleteObject
import { FirebaseService } from '../../../../../../services/firebase.service';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-edit-profile-picture',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile-picture.component.html',
  styleUrls: ['./edit-profile-picture.component.css'],
})
export class EditProfilePictureComponent implements OnInit, OnChanges {
  @Input() currentUser: User | null = null;
  profileForm!: FormGroup;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private storage: Storage,
    private firebaseService: FirebaseService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentUser'] && this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserData();
    }
  }

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserData();
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      profilePicture: [''],
    });
  }

  private async loadUserData(): Promise<void> {
    if (!this.userEmailKey) return;

    try {
      const userData = await this.firebaseService.getUserData(
        this.userEmailKey
      );

      // Verificar si hay URL de imagen válida
      if (userData?.profileData?.profilePicture) {
        // Forzar recarga de la imagen
        const timestamp = new Date().getTime();
        const imageUrl = `${userData.profileData.profilePicture}?${timestamp}`;

        this.profileForm.patchValue({ profilePicture: imageUrl });
      } else {
        this.profileForm.patchValue({ profilePicture: '' });
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('No se pudo cargar la imagen actual');
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.profileForm.patchValue({ profilePicture: reader.result });
      };
      reader.readAsDataURL(this.selectedFile);
    } else {
      this.profileForm.patchValue({ profilePicture: '' });
    }
  }

  async onSubmit(): Promise<void> {
    if (!this.selectedFile) {
      alert('Selecciona una imagen válida');
      return;
    }
    if (!this.userEmailKey || !this.currentUser?.email) {
      alert('Debes iniciar sesión para guardar cambios');
      return;
    }

    try {
      const PROFILE_PIC_NAME = "profile-picture.jpg"; // Nombre fijo para la imagen
      const storageRef = ref(
        this.storage,
        `cv-app/users/profile-pictures/${this.userEmailKey}/${PROFILE_PIC_NAME}`
      );

      // 1. Eliminar la imagen anterior si existe
      try {
        await deleteObject(storageRef);
        console.log('Imagen anterior eliminada correctamente');
      } catch (deleteError) {
        console.log('No existía imagen previa o error al eliminar:', deleteError);
      }

      // 2. Subir la nueva imagen
      await uploadBytes(storageRef, this.selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // 3. Actualizar la URL en la base de datos
      await this.firebaseService.updateUserData(this.currentUser.email, {
        profileData: {
          profilePicture: downloadURL,
        },
      });

      alert('¡Foto actualizada correctamente!');
      await this.loadUserData(); // Recargar la imagen en la vista
    } catch (error) {
      console.error('Error:', error);
      alert(
        `Error al guardar: ${
          error instanceof Error ? error.message : 'Intenta nuevamente'
        }`
      );
    }
  }
}