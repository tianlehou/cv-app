import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-curriculum-types-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './curriculum-types-info.component.html',
  styleUrls: ['./curriculum-types-info.component.css']
})
export class CurriculumTypesInfoComponent {
  @Output() back = new EventEmitter<void>();

  goBack(): void {
    this.back.emit();
  }
}