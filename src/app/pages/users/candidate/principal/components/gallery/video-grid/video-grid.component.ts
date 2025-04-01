import {
  Component,
  Input,
  inject,
  OnInit,
  ChangeDetectorRef,
  NgZone,
} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { User } from '@angular/fire/auth';
import {
  Storage,
  ref,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from '@angular/fire/storage';
import { FirebaseService } from '../../../../../../../services/firebase.service';
import { EnvironmentInjector } from '@angular/core';
import { DeleteConfirmModalComponent } from '../../../../../../../shared/components/delete-confirmation-modal/delete-confirmation-modal.component';
import { FileSizePipe } from '../../../../../../../pipes/filesize.pipe';

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [
    CommonModule,
    DeleteConfirmModalComponent,
    FileSizePipe,
    NgStyle,
  ],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css'],
})
export class VideoGridComponent implements OnInit {
  @Input() currentUser: User | null = null;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;
  userVideos: string[] = [];
  isLoading = false;
  isDeleteModalVisible = false;
  videoToDelete: string | null = null;

  // Propiedades de progreso
  uploadProgress: number | null = null;
  uploadedSize: number = 0;
  totalSize: number = 0;

  private injector = inject(EnvironmentInjector);

  constructor(
    private storage: Storage,
    private firebaseService: FirebaseService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
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

    this.ngZone.run(() => {
      this.isLoading = true;
      this.cdr.detectChanges();
    });

    try {
      const userData = await this.firebaseService.getUserData(this.userEmailKey);
      
      this.ngZone.run(() => {
        this.userVideos = userData?.profileData?.multimedia?.galleryVideos || [];
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error loading videos:', error);
        alert('Error cargando videos');
        this.cdr.detectChanges();
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];

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
    if (!this.selectedFile || !this.userEmailKey || !this.currentUser?.email)
      return;

    this.ngZone.run(() => {
      this.isLoading = true;
      this.uploadProgress = 0;
      this.totalSize = this.selectedFile!.size;
      this.uploadedSize = 0;
      this.cdr.detectChanges();
    });

    try {
      await runInInjectionContext(this.injector, async () => {
        const videoName = `gallery-video-${Date.now()}.${this.selectedFile!.name.split('.').pop()}`;
        const storageRef = ref(
          this.storage,
          `cv-app/users/${this.userEmailKey}/gallery-videos/${videoName}`
        );

        const uploadTask = uploadBytesResumable(storageRef, this.selectedFile!);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            this.ngZone.run(() => {
              this.uploadedSize = snapshot.bytesTransferred;
              this.totalSize = snapshot.totalBytes;
              this.uploadProgress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              this.cdr.detectChanges();
            });
          },
          (error) => {
            this.ngZone.run(() => {
              console.error('Upload error:', error);
              alert('Error al subir el video');
              this.resetUploadState();
            });
          },
          async () => {
            await runInInjectionContext(this.injector, async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              const userData = await this.firebaseService.getUserData(this.userEmailKey!);
              const currentVideos = userData?.profileData?.multimedia?.galleryVideos || [];
              const updatedVideos = [...currentVideos, downloadURL];

              const updatedData = {
                profileData: {
                  ...(userData?.profileData || {}),
                  multimedia: {
                    ...(userData?.profileData?.multimedia || {}),
                    galleryVideos: updatedVideos,
                  },
                },
              };

              await this.firebaseService.updateUserData(
                this.currentUser!.email!,
                updatedData
              );
            });

            this.ngZone.run(() => {
              alert('Video subido exitosamente');
              this.loadUserVideos();
              this.resetUploadState();
            });
          }
        );
      });
    } catch (error) {
      this.ngZone.run(() => {
        this.resetUploadState();
        console.error('Error uploading video:', error);
        alert('Error al subir el video');
        this.cdr.detectChanges();
      });
    }
  }

  private resetUploadState(): void {
    this.ngZone.run(() => {
      this.uploadProgress = null;
      this.uploadedSize = 0;
      this.totalSize = 0;
      this.isLoading = false;
      this.selectedFile = null;
      this.cdr.detectChanges();
    });
  }

  deleteVideo(videoUrl: string): void {
    this.videoToDelete = videoUrl;
    this.isDeleteModalVisible = true;
  }

  onDeleteConfirmed(): void {
    if (!this.videoToDelete) return;
    this.performDelete(this.videoToDelete);
    this.isDeleteModalVisible = false;
    this.videoToDelete = null;
  }

  onDeleteCanceled(): void {
    this.isDeleteModalVisible = false;
    this.videoToDelete = null;
  }

  private async performDelete(videoUrl: string): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;

    this.ngZone.run(() => {
      this.isLoading = true;
      this.cdr.detectChanges();
    });

    try {
      await runInInjectionContext(this.injector, async () => {
        const videoRef = ref(this.storage, videoUrl);
        await deleteObject(videoRef);

        const userData = await this.firebaseService.getUserData(this.userEmailKey!);
        const currentVideos = userData?.profileData?.multimedia?.galleryVideos || [];
        const updatedVideos = currentVideos.filter((vid: string) => vid !== videoUrl);

        const updatedData = {
          profileData: {
            ...(userData?.profileData || {}),
            multimedia: {
              ...(userData?.profileData?.multimedia || {}),
              galleryVideos: updatedVideos,
            },
          },
        };

        await this.firebaseService.updateUserData(
          this.currentUser!.email!,
          updatedData
        );
      });

      this.ngZone.run(() => {
        this.loadUserVideos();
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error deleting video:', error);
        alert('Error eliminando video');
        this.cdr.detectChanges();
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }
}

function runInInjectionContext(
  injector: EnvironmentInjector,
  callback: () => Promise<void>
): Promise<void> {
  return injector.runInContext(callback);
}