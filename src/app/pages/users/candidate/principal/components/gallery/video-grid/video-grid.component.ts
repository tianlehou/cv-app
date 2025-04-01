import { Component, Input, inject, OnInit } from '@angular/core';
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
import { EnvironmentInjector } from '@angular/core';
import { DeleteConfirmModalComponent } from '../../../../../../../shared/components/delete-confirmation-modal/delete-confirmation-modal.component';

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [CommonModule, DeleteConfirmModalComponent],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css']
})
export class VideoGridComponent implements OnInit {
  @Input() currentUser: User | null = null;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;
  userVideos: string[] = [];
  isLoading = false;
  isDeleteModalVisible = false;
  videoToDelete: string | null = null;
  private injector = inject(EnvironmentInjector);

  constructor(
    private storage: Storage,
    private firebaseService: FirebaseService
  ) {}

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserVideos();
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private async loadUserVideos(): Promise<void> {
    if (!this.userEmailKey) return;

    this.isLoading = true;
    try {
      const userData = await this.firebaseService.getUserData(this.userEmailKey);
      this.userVideos = userData?.profileData?.multimedia?.galleryVideos || [];
    } catch (error) {
      console.error('Error loading videos:', error);
      alert('No se pudieron cargar los videos');
    } finally {
      this.isLoading = false;
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('video/')) {
        alert('Formato de archivo inválido. Solo se permiten videos.');
        input.value = '';
        this.selectedFile = null;
        return;
      }
  
      this.selectedFile = file;
      this.uploadVideo();
    }
  }

  async uploadVideo(): Promise<void> {
    if (!this.selectedFile || !this.userEmailKey || !this.currentUser?.email) return;

    this.isLoading = true;
    try {
      await runInInjectionContext(this.injector, async () => {
        const videoName = `gallery-video-${Date.now()}.${this.selectedFile!.name.split('.').pop()}`;
        const storageRef = ref(
          this.storage,
          `cv-app/users/${this.userEmailKey}/gallery-videos/${videoName}`
        );

        const snapshot = await uploadBytes(storageRef, this.selectedFile!);
        const downloadURL = await getDownloadURL(snapshot.ref);

        const userData = await this.firebaseService.getUserData(this.userEmailKey!);
        const currentVideos = userData?.profileData?.multimedia?.galleryVideos || [];
        const updatedVideos = [...currentVideos, downloadURL];

        const updatedData = {
          profileData: {
            ...userData?.profileData || {},
            multimedia: {
              ...userData?.profileData?.multimedia || {},
              galleryVideos: updatedVideos
            }
          }
        };

        if (this.currentUser && this.currentUser.email) {
          await this.firebaseService.updateUserData(
            this.currentUser.email!,
            updatedData
          );
          console.log('Datos actualizados correctamente');
        }
        await this.loadUserVideos();
      });
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Error al subir el video');
    } finally {
      this.isLoading = false;
      this.selectedFile = null;
    }
  }

  deleteVideo(videoUrl: string): void {
    console.log('Delete button clicked, videoUrl:', videoUrl); // Depuración
    this.videoToDelete = videoUrl;
    this.isDeleteModalVisible = true;
    console.log('isDeleteModalVisible:', this.isDeleteModalVisible); // Depuración
  }

  onDeleteConfirmed(): void {
    console.log('Delete confirmed'); // Depuración
    if (!this.videoToDelete) return;
    this.performDelete(this.videoToDelete);
    this.isDeleteModalVisible = false;
    this.videoToDelete = null;
  }

  onDeleteCanceled(): void {
    console.log('Delete canceled'); // Depuración
    this.isDeleteModalVisible = false;
    this.videoToDelete = null;
  }

  private async performDelete(videoUrl: string): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;

    this.isLoading = true;
    try {
      await runInInjectionContext(this.injector, async () => {
        const videoRef = ref(this.storage, videoUrl);
        await deleteObject(videoRef);

        const userData = await this.firebaseService.getUserData(this.userEmailKey!);
        const currentVideos = userData?.profileData?.multimedia?.galleryVideos || [];
        const updatedVideos = currentVideos.filter((vid: string) => vid !== videoUrl);

        const updatedData = {
          profileData: {
            ...userData?.profileData || {},
            multimedia: {
              ...userData?.profileData?.multimedia || {},
              galleryVideos: updatedVideos
            }
          }
        };

        if (this.currentUser && this.currentUser.email) {
          await this.firebaseService.updateUserData(
            this.currentUser.email!,
            updatedData
          );
          console.log('Datos actualizados correctamente');
        }
        await this.loadUserVideos();
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('Error al eliminar el video');
    } finally {
      this.isLoading = false;
    }
  }
}

function runInInjectionContext(
  injector: EnvironmentInjector,
  callback: () => Promise<void>
): Promise<void> {
  return injector.runInContext(callback);
}