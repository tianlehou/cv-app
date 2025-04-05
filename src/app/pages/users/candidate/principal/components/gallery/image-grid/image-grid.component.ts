import {
  Component,
  OnInit,
  Input,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  NgZone,
  EnvironmentInjector,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@angular/fire/auth';
import { Storage, ref, deleteObject } from '@angular/fire/storage';
import { ToastService } from '../../../../../../../services/toast.service';
import { FirebaseService } from '../../../../../../../services/firebase.service';
import { DeleteConfirmModalComponent } from '../../../../../../../components/delete-confirmation-modal/delete-confirmation-modal.component';
import { ImageInfoBarComponent } from './image-info-bar/image-info-bar.component';
import { ImageUploadContainerComponent } from './image-upload-container/image-upload-container.component';

@Component({
  selector: 'app-image-grid',
  standalone: true,
  imports: [
    CommonModule,
    DeleteConfirmModalComponent,
    ImageInfoBarComponent,
    ImageUploadContainerComponent,
  ],
  templateUrl: './image-grid.component.html',
  styleUrls: ['./image-grid.component.css'],
})
export class ImageGridComponent implements OnInit, OnDestroy {
  @Input() currentUser: User | null = null;

  // Propiedades de estado
  userEmailKey: string | null = null;

  userImages: string[] = [];
  isLoading = false;
  isDeleteModalVisible = false;
  imageToDelete: string | null = null;

  // Propiedades de marca de agua
  private readonly watermarkPositions = [
    'top-1',
    'top-2',
    'center',
    'bottom-2',
    'bottom-1',
  ];
  currentWatermarkPosition = 'bottom-right';
  watermarkOpacity = 0.7;
  private watermarkInterval: any;

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
      this.startWatermarkRotation();
    }
  }

  ngOnDestroy(): void {
    this.clearWatermarkInterval();
  }

  // Métodos públicos
  getWatermarkPosition(): string {
    return this.currentWatermarkPosition;
  }

  deleteImage(imageUrl: string): void {
    this.imageToDelete = imageUrl;
    this.isDeleteModalVisible = true;
  }

  onDeleteConfirmed(): void {
    if (!this.imageToDelete) return;
    this.performDelete(this.imageToDelete);
    this.isDeleteModalVisible = false;
  }

  onDeleteCanceled(): void {
    this.isDeleteModalVisible = false;
    this.imageToDelete = null;
  }

  // Métodos privados
  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private async loadUserImages(addedImageUrl?: string): Promise<void> {
    if (!this.userEmailKey) return;

    this.setLoadingState(true);

    try {
      const userData = await this.firebaseService.getUserData(
        this.userEmailKey
      );
      let images = userData?.profileData?.multimedia?.galleryImages || [];

      // Si se añadió una nueva imagen, asegurarse de que esté en la lista
      if (addedImageUrl && !images.includes(addedImageUrl)) {
        images = [...images, addedImageUrl];
      }

      this.userImages = this.sortImagesByDate(images);
    } catch (error) {
      console.error('Error loading images:', error);
      this.toast.show('Error cargando imágenes', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  // método para manejar la finalización de la subida
  public async handleUploadComplete(imageUrl: string): Promise<void> {
    await this.updateUserGallery(imageUrl);
    this.loadUserImages(imageUrl);
  }

  private sortImagesByDate(images: string[]): string[] {
    return images.sort((a, b) => {
      const getTimestamp = (url: string) => {
        const filename = url.split('%2F').pop()?.split('?')[0] || '';
        const timestampMatch = filename.match(/-(\d+)\./);
        return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });
  }

  private startWatermarkRotation(): void {
    this.watermarkInterval = setInterval(() => {
      const currentIndex = this.watermarkPositions.indexOf(
        this.currentWatermarkPosition
      );
      const nextIndex = (currentIndex + 1) % this.watermarkPositions.length;
      this.currentWatermarkPosition = this.watermarkPositions[nextIndex];
      this.watermarkOpacity = 0.6 + Math.random() * 0.3;
      this.cdr.detectChanges();
    }, 3000);
  }

  private clearWatermarkInterval(): void {
    if (this.watermarkInterval) {
      clearInterval(this.watermarkInterval);
    }
  }

  private async updateUserGallery(imageUrl: string): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;

    const userData = await this.firebaseService.getUserData(this.userEmailKey);
    const updatedData = {
      profileData: {
        ...(userData?.profileData || {}),
        multimedia: {
          ...(userData?.profileData?.multimedia || {}),
          galleryImages: [
            ...(userData?.profileData?.multimedia?.galleryImages || []),
            imageUrl,
          ],
        },
      },
    };
    await this.firebaseService.updateUserData(
      this.currentUser.email,
      updatedData
    );
  }

  private setLoadingState(isLoading: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = isLoading;
      this.cdr.detectChanges();
    });
  }

  private async performDelete(imageUrl: string): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;

    this.setLoadingState(true);

    try {
      await runInInjectionContext(this.injector, async () => {
        await deleteObject(ref(this.storage, imageUrl));
        await this.removeImageFromUserData(imageUrl);
      });
      this.ngZone.run(() => {
        this.toast.show('Imagen eliminada exitosamente', 'success');
        this.loadUserImages();
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      this.toast.show('Error eliminando imagen', 'error');
    } finally {
      this.setLoadingState(false);
    }
  }

  private async removeImageFromUserData(imageUrl: string): Promise<void> {
    const userData = await this.firebaseService.getUserData(this.userEmailKey!);
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
  }
}

function runInInjectionContext(
  injector: EnvironmentInjector,
  callback: () => Promise<void>
): Promise<void> {
  return injector.runInContext(callback);
}
