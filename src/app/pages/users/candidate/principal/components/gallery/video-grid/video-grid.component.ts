import {
  Component,
  Input,
  OnInit,
  ChangeDetectorRef,
  NgZone,
  ViewChildren,
  QueryList,
  ElementRef,
  AfterViewInit,
  inject,
} from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule, NgStyle } from '@angular/common';
import { FileSizePipe } from '../../../../../../../shared/pipes/filesize.pipe';
import { VideoService } from '../../../../../../../shared/services/video.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { FirebaseService } from '../../../../../../../shared/services/firebase.service';
import { ConfirmationModalService } from '../../../../../../../shared/services/confirmation-modal.service';

@Component({
  selector: 'app-video-grid',
  standalone: true,
  imports: [CommonModule, FileSizePipe, NgStyle],
  templateUrl: './video-grid.component.html',
  styleUrls: ['./video-grid.component.css'],
})
export class VideoGridComponent implements OnInit, AfterViewInit {
  @ViewChildren('videoPlayer') videoPlayers!: QueryList<ElementRef<HTMLVideoElement>>;
  @Input() currentUser: User | null = null;
  
  userEmailKey: string | null = null;
  userVideos: string[] = [];
  isLoading = false;
  expandedStates: { [videoUrl: string]: boolean } = {};
  totalUploadedMB = 0;
  
  // Upload progress
  uploadProgress: number | null = null;
  uploadedSize = 0;
  totalSize = 0;

  private videoService = inject(VideoService);
  private toast = inject(ToastService);
  private confirmationModal = inject(ConfirmationModalService);
  private firebaseService = inject(FirebaseService);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
      this.loadVideos();
    }
  }

  ngAfterViewInit(): void {
    this.setupVideoPlayers();
    this.videoPlayers.changes.subscribe(() => this.setupVideoPlayers());
  }

  private setupVideoPlayers(): void {
    this.videoPlayers.forEach(video => {
      video.nativeElement.addEventListener('play', (e: Event) => this.onVideoPlay(e));
    });
  }

  private onVideoPlay(event: Event): void {
    const playingVideo = event.target as HTMLVideoElement;
    this.videoPlayers.forEach(video => {
      if (video.nativeElement !== playingVideo) {
        video.nativeElement.pause();
      }
    });
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  private async loadVideos(): Promise<void> {
    if (!this.userEmailKey) return;
    this.setLoading(true);
    
    try {
      const videos = await this.videoService.getVideos(this.userEmailKey);
      const sortedVideos = this.sortVideosByDate(videos);
      this.calculateTotalSize(sortedVideos);
      
      this.ngZone.run(() => {
        this.userVideos = sortedVideos;
        this.initExpandedStates(sortedVideos);
        this.cdr.detectChanges();
      });
    } catch (error) {
      this.handleError('Error cargando videos', error);
    } finally {
      this.setLoading(false);
    }
  }

  private async calculateTotalSize(videos: string[]): Promise<void> {
    try {
      const totalBytes = await this.videoService.calculateTotalSize(videos);
      this.totalUploadedMB = totalBytes / 1048576;
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error calculando tamaño total:', error);
    }
  }

  private initExpandedStates(videos: string[]): void {
    this.expandedStates = {};
    videos.forEach(video => {
      this.expandedStates[video] = false;
    });
  }

  private sortVideosByDate(videos: string[]): string[] {
    return [...videos].sort((a, b) => {
      const getTimestamp = (url: string) => {
        const filename = url.split('%2F').pop()?.split('?')[0] || '';
        const timestampMatch = filename.match(/-(\d+)\./);
        return timestampMatch ? parseInt(timestampMatch[1], 10) : 0;
      };
      return getTimestamp(b) - getTimestamp(a);
    });
  }

  toggleExpansion(videoUrl: string): void {
    this.expandedStates[videoUrl] = !this.expandedStates[videoUrl];
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (!file.type.startsWith('video/')) {
      this.toast.show('Formato de archivo inválido. Solo se permiten videos.', 'error');
      input.value = '';
      return;
    }

    this.uploadVideo(file);
  }

  private async uploadVideo(file: File): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;

    this.setUploadProgress(0, 0, file.size);
    this.setLoading(true);

    try {
      const downloadURL = await this.videoService.uploadVideo(
        this.userEmailKey,
        file,
        (progress, uploaded, total) => {
          this.ngZone.run(() => this.setUploadProgress(progress, uploaded, total));
        }
      );

      await this.updateUserVideos([...this.userVideos, downloadURL]);
      this.toast.show('Video subido exitosamente', 'success');
      this.loadVideos();
    } catch (error) {
      this.handleError('Error al subir el video', error);
    } finally {
      this.resetUploadState();
    }
  }

  private async updateUserVideos(videos: string[]): Promise<void> {
    if (!this.userEmailKey || !this.currentUser?.email) return;
  
    try {
      // Obtener datos actuales primero
      const currentData = await this.firebaseService.getUserData(this.userEmailKey);
      const updatedData = {
        profileData: {
          ...currentData.profileData,
          multimedia: {
            ...currentData.profileData?.multimedia,
            galleryVideos: videos
          }
        }
      };
  
      await this.firebaseService.updateUserData(this.currentUser.email, updatedData);
    } catch (error) {
      this.handleError('Error actualizando videos', error);
    }
  }

  confirmDeleteVideo(videoUrl: string): void {
    this.confirmationModal.show(
      {
        title: 'Eliminar Video',
        message: '¿Estás seguro de que deseas eliminar este video?'
      },
      () => this.deleteVideo(videoUrl)
    );
  }

  private async deleteVideo(videoUrl: string): Promise<void> {
    if (!this.userEmailKey) return;
    this.setLoading(true);

    try {
      await this.videoService.deleteVideo(videoUrl);
      const updatedVideos = this.userVideos.filter(vid => vid !== videoUrl);
      await this.updateUserVideos(updatedVideos);
      this.toast.show('Video eliminado exitosamente', 'success');
      this.loadVideos();
    } catch (error) {
      this.handleError('Error eliminando video', error);
    } finally {
      this.setLoading(false);
    }
  }

  // Helpers
  private setLoading(isLoading: boolean): void {
    this.ngZone.run(() => {
      this.isLoading = isLoading;
      this.cdr.detectChanges();
    });
  }

  private setUploadProgress(progress: number, uploaded: number, total: number): void {
    this.uploadProgress = progress;
    this.uploadedSize = uploaded;
    this.totalSize = total;
    this.cdr.detectChanges();
  }

  private resetUploadState(): void {
    this.ngZone.run(() => {
      this.uploadProgress = null;
      this.uploadedSize = 0;
      this.totalSize = 0;
      this.isLoading = false;
      this.cdr.detectChanges();
    });
  }

  private handleError(message: string, error: any): void {
    this.ngZone.run(() => {
      console.error(`${message}:`, error);
      this.toast.show(message, 'error');
      this.cdr.detectChanges();
    });
  }
}