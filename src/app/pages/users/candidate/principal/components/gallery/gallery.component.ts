import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css']
})
export class GalleryComponent {

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
    { url: 'https://picsum.photos/400/400?random=12' }
  ];
}