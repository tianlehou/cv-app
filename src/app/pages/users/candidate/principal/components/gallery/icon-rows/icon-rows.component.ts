import { Component, EventEmitter, Output } from '@angular/core';
import { GalleryView } from '../gallery.component';

type IconType = 'image' | 'video' | 'cv';

@Component({
  selector: 'app-icon-rows',
  standalone: true,
  templateUrl: './icon-rows.component.html',
  styleUrls: ['./icon-rows.component.css']
})
export class IconRowsComponent {
  @Output() iconSelected = new EventEmitter<GalleryView>();

  selectIcon(iconType: GalleryView): void {
    this.iconSelected.emit(iconType);
  }
}