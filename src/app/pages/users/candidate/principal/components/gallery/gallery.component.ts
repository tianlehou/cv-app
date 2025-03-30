import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconRowsComponent } from './icon-rows/icon-rows.component';
import { ImageGridComponent } from './image-grid/image-grid.component';
import { VideoGridComponent } from './video-grid/video-grid.component';
import { CvGridComponent } from './cv-grid/cv-grid.component';

export type GalleryView = 'image' | 'video' | 'cv';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [
    CommonModule,
    IconRowsComponent,
    ImageGridComponent,
    VideoGridComponent,
    CvGridComponent,
  ],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css'],
})
export class GalleryComponent {
  activeView: GalleryView = 'image'; // Vista por defecto

  // Mock de imágenes (reemplaza con datos de Firebase)
  images = [
    { url: 'https://picsum.photos/400/400?random=1' },
    { url: 'https://picsum.photos/400/400?random=2' },
    { url: 'https://picsum.photos/400/400?random=3' },
    { url: 'https://picsum.photos/400/400?random=4' },
    { url: 'https://picsum.photos/400/400?random=5' },
    { url: 'https://picsum.photos/400/400?random=6' },
    { url: 'https://picsum.photos/400/400?random=7' },
    { url: 'https://picsum.photos/400/400?random=8' },
    { url: 'https://picsum.photos/400/400?random=9' },
    { url: 'https://picsum.photos/400/400?random=10' },
    { url: 'https://picsum.photos/400/400?random=11' },
    { url: 'https://picsum.photos/400/400?random=12' },
  ];

  // Ejemplo de datos para los componentes
  videoList = [
    {
      url: 'assets/videos/demo.mp4',
      type: 'video/mp4',
      title: 'Presentación de producto',
    },
    // ... más videos
  ];

  cvList = [
    {
      name: 'Carlos Pérez',
      position: 'Desarrollador Frontend',
      downloadUrl: 'assets/cvs/carlos-perez.pdf',
    },
    // ... más CVs
  ];

  // Método corregido y tipado
  onIconSelected(iconType: GalleryView): void {
    this.activeView = iconType;
  }
}
