import {
  Component,
  Input,
  inject,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  EnvironmentInjector,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, NgStyle } from '@angular/common';
import { User } from '@angular/fire/auth';
import {
  Storage,
  ref,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
  getMetadata
} from '@angular/fire/storage';
import { ToastService } from '../../../../../../../services/toast.service';
import { FirebaseService } from '../../../../../../../services/firebase.service';
import { ConfirmationModalService } from '../../../../../../../services/confirmation-modal.service';
import { FileSizePipe } from '../../../../../../../pipes/filesize.pipe';

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [CommonModule, FileSizePipe, NgStyle],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css'],
})
export class VideoGridComponent implements OnInit, AfterViewInit {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<
    ElementRef<HTMLVideoElement>
  >;
  @Input() currentUser: User | null = null;
  userEmailKey: string | null = null;
  selectedFile: File | null = null;
  userVideos: string[] = [];
  isLoading = false;
  videoToDelete: string | null = null;
  expandedStates: { [videoUrl: string]: boolean } = {};
  totalUploadedMB: number = 0;
  // Propiedades de progreso
  uploadProgress: number | null = null;
  uploadedSize: number = 0;
  totalSize: number = 0;

  private injector = inject(EnvironmentInjector);

  constructor(
    private cdr: ChangeDetectorRef,
    private firebaseService: FirebaseService,
    private ngZone: NgZone,
    private storage: Storage,
    private toast: ToastService,
    private ConfirmationModalService: ConfirmationModalService
  ) {}

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadUserVideos();
    }
  }

  ngAfterViewInit(): void {
    this.videoPlayers.forEach((video) => {
      video.nativeElement.addEventListener('play', (e: Event) =>
        this.onVideoPlay(e)
      );
    });

    this.videoPlayers.changes.subscribe(() => {
      this.videoPlayers.forEach((video) => {
        video.nativeElement.addEventListener('play', (e: Event) =>
          this.onVideoPlay(e)
        );
      });
    });
  }

  private onVideoPlay(event: Event): void {
    const playingVideo = event.target as HTMLVideoElement;
    this.videoPlayers.forEach((video) => {
      if (video.nativeElement !== playingVideo) {
        video.nativeElement.pause();
      }
    });
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
      const userData = await this.firebaseService.getUserData(
        this.userEmailKey
      );
      const videos = userData?.profileData?.multimedia?.galleryVideos || [];

      const sortedVideos = this.sortVideosByDate(videos); // Ordenar videos por fecha (nuevos primero)
      await this.calculateTotalUploadedSize(sortedVideos); // Calcular el total de MB subidos

      this.ngZone.run(() => {
        this.userVideos = sortedVideos;
        this.expandedStates = {}; // Initialize expanded states for all videos
        sortedVideos.forEach((video) => {
          this.expandedStates[video] = false;
        });
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error loading videos:', error);
        this.toast.show('Error cargando videos', 'error');
        this.cdr.detectChanges();
      });
    } finally {
      this.ngZone.run(() => {
        this.isLoading = false;
        this.cdr.detectChanges();
      });
    }
  }

  // método para calcular el total de mega subido
  private async calculateTotalUploadedSize(videos: string[]): Promise<void> {
    let totalBytes = 0;
  
    // Crear un array de promesas para obtener los metadatos de cada video
    const metadataPromises = videos.map(async (url) => {
      try {
        // Crear una referencia al archivo usando la URL
        const videoRef = ref(this.storage, url);
        // Obtener los metadatos del archivo
        const metadata = await getMetadata(videoRef);
        return metadata.size || 0;
      } catch (error) {
        console.error('Error obteniendo metadatos para:', url, error);
        return 0;
      }
    });
  
    // Esperar a que todas las promesas se resuelvan
    const sizes = await Promise.all(metadataPromises);
    totalBytes = sizes.reduce((sum, size) => sum + size, 0);
  
    // Convertir bytes a MB (1 MB = 1048576 bytes)
    this.totalUploadedMB = totalBytes / 1048576;
  }

  //método para ordenar videos
  private sortVideosByDate(videos: string[]): string[] {
    return videos.sort((a, b) => {
      const getTimestamp = (url: string) => {
        const filename = url.split('%2F').pop()?.split('?')[0] || '';
        const timestampMatch = filename.match(/-(\d+)\./);
        return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
      };

      return getTimestamp(b) - getTimestamp(a); // Orden descendente
    });
  }

  // method to toggle expansion
  toggleExpansion(videoUrl: string): void {
    this.expandedStates[videoUrl] = !this.expandedStates[videoUrl];
    this.cdr.detectChanges();
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
        const videoName = `gallery-video-${Date.now()}.${this.selectedFile!.name.split(
          '.'
        ).pop()}`;
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
              this.toast.show('Error al subir el video', 'error');
              this.resetUploadState();
            });
          },
          async () => {
            await runInInjectionContext(this.injector, async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

              const userData = await this.firebaseService.getUserData(
                this.userEmailKey!
              );
              const currentVideos =
                userData?.profileData?.multimedia?.galleryVideos || [];
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
              this.toast.show('Video subido exitosamente', 'success');
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
        this.toast.show('Error al subir el video', 'error');
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

  // Método para cancelar la carga de un video
  confirmDeleteVideo(videoUrl: string): void {
    this.videoToDelete = videoUrl;
    this.ConfirmationModalService.show(
      {
        title: 'Eliminar Video',
        message: '¿Estás seguro de que deseas eliminar este video?'
      },
      () => this.onDeleteConfirmed()
    );
  }

  onDeleteConfirmed(): void {
    if (this.videoToDelete) {
      this.performDelete(this.videoToDelete);
    }
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

        const userData = await this.firebaseService.getUserData(
          this.userEmailKey!
        );
        const currentVideos =
          userData?.profileData?.multimedia?.galleryVideos || [];
        const updatedVideos = currentVideos.filter(
          (vid: string) => vid !== videoUrl
        );

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
        this.toast.show('Video eliminado exitosamente', 'success');
        this.loadUserVideos();
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.ngZone.run(() => {
        console.error('Error deleting video:', error);
        this.toast.show('Error eliminando video', 'error');
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