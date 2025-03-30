import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cv-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cv-grid.component.html',
  styleUrls: ['./cv-grid.component.css']
})
export class CvGridComponent {
  @Input() cvs: {
    name: string,
    position: string,
    downloadUrl: string
  }[] = [];
}