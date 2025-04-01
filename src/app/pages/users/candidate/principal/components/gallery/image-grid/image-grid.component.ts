import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import {
  Storage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { FirebaseService } from '../../../../../../../services/firebase.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EnvironmentInjector } from '@angular/core';
import { DeleteConfirmModalComponent } from '../../../../../../../shared/components/delete-confirmation-modal/delete-confirmation-modal.component';

@Component({
  selector: 'app-image-grid',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DeleteConfirmModalComponent],
  templateUrl: './image-grid.component.html',
  styleUrls: ['./image-grid.component.css'],
})
export class ImageGridComponent implements OnInit {
  @Input() currentUser: User | null = null;
  imagesForm!: FormGroup;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;
  userImages: string[] = [];
  isLoading = false;
  isDeleteModalVisible = false;
  imageToDelete: string | null = null;
  private injector = inject(EnvironmentInjector);

  constructor(
    private fb: FormBuilder,
    private storage: Storage,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserImages();
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private initializeForm(): void {
    this.imagesForm = this.fb.group({
      imageUpload: [''],
    });
  }

  private async loadUserImages(): Promise<void> {
    if (!this.userEmailKey) return;

    this.isLoading = true;
    try {
      const userData = await this.firebaseService.getUserData(
        this.userEmailKey
      );
      this.userImages = userData?.profileData?.multimedia?.galleryImages || [];
    } catch (error) {
      console.error('Error loading images:', error);
      alert('No se pudieron cargar las imágenes');
    } finally {
      this.isLoading = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Formato de archivo inválido. Solo se permiten imágenes.');
        input.value = '';
        this.selectedFile = null;
        return;
      }
  
      this.selectedFile = file;
      this.uploadImage();
    }
  }

  async uploadImage(): Promise<void> {
    if (!this.selectedFile || !this.userEmailKey || !this.currentUser?.email) {
      return;
    }

    this.isLoading = true;
    try {
      await runInInjectionContext(this.injector, async () => {
        // Generar un nombre único para la imagen
        const imageName = `gallery-image-${Date.now()}.jpg`;
        const storageRef = ref(
          this.storage,
          `cv-app/users/${this.userEmailKey}/gallery-images/${imageName}`
        );

        // Subir la nueva imagen
        await uploadBytes(storageRef, this.selectedFile!);
        const downloadURL = await getDownloadURL(storageRef);

        // Obtener datos actuales del usuario
        const userData = await this.firebaseService.getUserData(
          this.userEmailKey!
        );

        // Crear array actualizado de imágenes
        const currentImages =
          userData?.profileData?.multimedia?.galleryImages || [];
        const updatedImages = [...currentImages, downloadURL];

        // Crear objeto actualizado
        const updatedData = {
          profileData: {
            ...(userData?.profileData || {}),
            multimedia: {
              ...(userData?.profileData?.multimedia || {}),
              galleryImages: updatedImages,
            },
          },
        };

        // Actualizar en Firebase
        if (this.currentUser && this.currentUser.email) {
          await this.firebaseService.updateUserData(
            this.currentUser.email!,
            updatedData
          );
        } else {
          throw new Error('User email is null');
        }

        // Recargar imágenes
        await this.loadUserImages();
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      this.isLoading = false;
      this.selectedFile = null;
    }
  }

  deleteImage(imageUrl: string): void {
    this.imageToDelete = imageUrl;
    this.isDeleteModalVisible = true;
  }

  onDeleteConfirmed(): void {
    if (!this.imageToDelete) return;
    this.performDelete(this.imageToDelete);
    this.isDeleteModalVisible = false;
    this.imageToDelete = null;
  }

  onDeleteCanceled(): void {
    this.isDeleteModalVisible = false;
    this.imageToDelete = null;
  }

  private async performDelete(imageUrl: string): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;

    this.isLoading = true;
    try {
      await runInInjectionContext(this.injector, async () => {
        const imageRef = ref(this.storage, imageUrl);
        await deleteObject(imageRef);

        const userData = await this.firebaseService.getUserData(
          this.userEmailKey!
        );
        const currentImages =
          userData?.profileData?.multimedia?.galleryImages || [];
        const updatedImages = currentImages.filter(
          (img: string) => img !== imageUrl
        );

        const updatedData = {
          profileData: {
            ...(userData?.profileData || {}),
            multimedia: {
              ...(userData?.profileData?.multimedia || {}),
              galleryImages: updatedImages,
            },
          },
        };

        if (this.currentUser?.email) {
          await this.firebaseService.updateUserData(
            this.currentUser.email,
            updatedData
          );
        }
        await this.loadUserImages();
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('Error al eliminar la imagen');
    } finally {
      this.isLoading = false;
    }
  }
}

// Función auxiliar para ejecutar en contexto de inyección
function runInInjectionContext(
  injector: EnvironmentInjector,
  callback: () => Promise<void>
): Promise<void> {
  return injector.runInContext(callback);
}
