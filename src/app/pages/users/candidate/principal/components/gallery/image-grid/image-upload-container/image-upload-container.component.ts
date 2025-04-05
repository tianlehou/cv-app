import { CommonModule, NgStyle } from '@angular/common';
import { 
  Component, 
  Output, 
  EventEmitter, 
  Input, 
  inject, 
  ChangeDetectorRef, 
  NgZone,
  EnvironmentInjector,
  OnDestroy
} from '@angular/core';
import { FileSizePipe } from '../../../../../../../../pipes/filesize.pipe';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { ToastService } from '../../../../../../../../services/toast.service';
import { runInInjectionContext } from '@angular/core';

@Component({
  selector: 'app-image-upload-container',
  standalone: true,
  imports: [CommonModule, FileSizePipe, NgStyle],
  templateUrl: './image-upload-container.component.html',
  styleUrls: ['./image-upload-container.component.css']
})
export class ImageUploadContainerComponent implements OnDestroy {
  @Input() userEmailKey: string | null = null;
  @Output() uploadComplete = new EventEmitter<string>();
  
  // Propiedades de estado
  selectedFile: File | null = null;
  
  // Propiedades de progreso de carga
  uploadProgress: number | null = null;
  uploadedSize = 0;
  totalSize = 0;

  private injector = inject(EnvironmentInjector);
  private storage = inject(Storage);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      this.toast.show(
        'Formato de archivo inválido. Solo se permiten imágenes.',
        'error'
      );
      input.value = '';
      return;
    }

    this.selectedFile = file;
    this.uploadImage();
  }

  private async uploadImage(): Promise<void> {
    if (!this.selectedFile || !this.userEmailKey) return;

    this.setUploadState(true);

    try {
      await runInInjectionContext(this.injector, async () => {
        const imageName = `gallery-image-${Date.now()}.${this.selectedFile!.name.split('.').pop()}`;
        const storagePath = `cv-app/users/${this.userEmailKey}/gallery-images/${imageName}`;
        const storageRef = ref(this.storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, this.selectedFile!);

        uploadTask.on(
          'state_changed',
          (snapshot) => this.updateUploadProgress(snapshot),
          (error) => this.handleUploadError(error),
          async () => await this.handleUploadComplete(uploadTask)
        );
      });
    } catch (error) {
      this.handleUploadError(error);
    }
  }

  private updateUploadProgress(snapshot: any): void {
    this.ngZone.run(() => {
      this.uploadedSize = snapshot.bytesTransferred;
      this.totalSize = snapshot.totalBytes;
      this.uploadProgress = Math.round(
        (snapshot.bytesTransferred / snapshot.totalBytes) * 100
      );
      this.cdr.detectChanges();
    });
  }

  private async handleUploadComplete(uploadTask: any): Promise<void> {
    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
    this.ngZone.run(() => {
      this.toast.show('Imagen subida exitosamente', 'success');
      this.uploadComplete.emit(downloadURL);
      this.resetUploadState();
    });
  }

  private handleUploadError(error: any): void {
    this.ngZone.run(() => {
      console.error('Upload error:', error);
      this.toast.show('Error al subir la imagen', 'error');
      this.resetUploadState();
    });
  }

  private setUploadState(isUploading: boolean): void {
    this.uploadProgress = isUploading ? 0 : null;
    this.uploadedSize = 0;
    this.totalSize = isUploading ? this.selectedFile?.size || 0 : 0;
    this.cdr.detectChanges();
  }

  private resetUploadState(): void {
    this.setUploadState(false);
    this.selectedFile = null;
  }

  ngOnDestroy(): void {
    // Limpieza si es necesaria
  }
}