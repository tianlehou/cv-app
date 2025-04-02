import {
  Component,
  OnInit,
  Input,
  inject,
  ChangeDetectorRef,
  NgZone,
  EnvironmentInjector,
} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { User } from '@angular/fire/auth';
import {
  Storage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { ToastService } from '../../../../../../../services/toast.service';
import { FirebaseService } from '../../../../../../../services/firebase.service';
import { DeleteConfirmModalComponent } from '../../../../../../../components/delete-confirmation-modal/delete-confirmation-modal.component';
import { FileSizePipe } from '../../../../../../../pipes/filesize.pipe';

@Component({
  selector: 'app-image-grid',
  standalone: true,
  imports: [CommonModule, DeleteConfirmModalComponent, FileSizePipe, NgStyle],
  templateUrl: './image-grid.component.html',
  styleUrls: ['./image-grid.component.css'],
})
export class ImageGridComponent implements OnInit {
  @Input() currentUser: User | null = null;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;
  userImages: string[] = [];
  isLoading = false;
  isDeleteModalVisible = false;
  imageToDelete: string | null = null;

  // Nuevas propiedades de progreso
  uploadProgress: number | null = null;
  uploadedSize: number = 0;
  totalSize: number = 0;

  private injector = inject(EnvironmentInjector);

  constructor(
    private storage: Storage,
    private firebaseService: FirebaseService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}
  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserImages();
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private async loadUserImages(): Promise<void> {
    if (!this.userEmailKey) return;

    this.ngZone.run(() => {
      this.isLoading = true;
      this.cdr.detectChanges();
    });

    try {
      const userData = await this.firebaseService.getUserData(
        this.userEmailKey
      );
      const images = userData?.profileData?.multimedia?.galleryImages || [];

      // Ordenar imágenes por fecha (nuevas primero)
      const sortedImages = this.sortImagesByDate(images);

      this.ngZone.run(() => {
        this.userImages = sortedImages;
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error loading images:', error);
        this.toast.show('Error cargando imágenes', 'error');
        this.cdr.detectChanges();
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  // método para ordenar
  private sortImagesByDate(images: string[]): string[] {
    return images.sort((a, b) => {
      // Extraer timestamp del nombre del archivo
      const getTimestamp = (url: string) => {
        const filename = url.split('%2F').pop()?.split('?')[0] || '';
        const timestampMatch = filename.match(/-(\d+)\./);
        return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
      };

      return getTimestamp(b) - getTimestamp(a); // Orden descendente
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      const file = input.files[0];

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.toast.show(
          'Formato de archivo inválido. Solo se permiten imágenes.',
          'error'
        );
        input.value = '';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
      this.uploadImage();
    }
  }

  async uploadImage(): Promise<void> {
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
        const imageName = `gallery-image-${Date.now()}.${this.selectedFile!.name.split(
          '.'
        ).pop()}`;
        const storageRef = ref(
          this.storage,
          `cv-app/users/${this.userEmailKey}/gallery-images/${imageName}`
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
              this.toast.show('Error al subir la imagen', 'error');
              this.resetUploadState();
            });
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            const userData = await this.firebaseService.getUserData(
              this.userEmailKey!
            );

            const updatedData = {
              profileData: {
                ...(userData?.profileData || {}),
                multimedia: {
                  ...(userData?.profileData?.multimedia || {}),
                  galleryImages: [
                    ...(userData?.profileData?.multimedia?.galleryImages || []),
                    downloadURL,
                  ],
                },
              },
            };

            await this.firebaseService.updateUserData(
              this.currentUser!.email!,
              updatedData
            );

            this.ngZone.run(() => {
              this.toast.show('Imagen subida exitosamente', 'success');
              this.loadUserImages();
              this.resetUploadState();
            });
          }
        );
      });
    } catch (error) {
      this.ngZone.run(() => {
        this.resetUploadState();
        console.error('Error uploading image:', error);
        this.toast.show('Error al subir la imagen', 'error');
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

    this.ngZone.run(() => {
      this.isLoading = true;
      this.cdr.detectChanges();
    });

    try {
      await runInInjectionContext(this.injector, async () => {
        const imageRef = ref(this.storage, imageUrl);
        await deleteObject(imageRef);

        const userData = await this.firebaseService.getUserData(
          this.userEmailKey!
        );
        const updatedImages = (
          userData?.profileData?.multimedia?.galleryImages || []
        ).filter((img: string) => img !== imageUrl);

        const updatedData = {
          profileData: {
            ...(userData?.profileData || {}),
            multimedia: {
              ...(userData?.profileData?.multimedia || {}),
              galleryImages: updatedImages,
            },
          },
        };

        await this.firebaseService.updateUserData(
          this.currentUser!.email!,
          updatedData
        );
      });

      this.ngZone.run(() => {
        this.toast.show('Imagen eliminada exitosamente', 'success');
        this.loadUserImages();
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error deleting image:', error);
        this.toast.show('Error eliminando imagen', 'error');
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

// Función auxiliar para ejecutar en contexto de inyección
function runInInjectionContext(
  injector: EnvironmentInjector,
  callback: () => Promise<void>
): Promise<void> {
  return injector.runInContext(callback);
}
