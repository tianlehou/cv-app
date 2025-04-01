import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `<div *ngIf="show" class="toast {{ type }}">{{ message }}</div>`,
  styleUrls: ['./toast.component.css'],
  imports: [CommonModule],
})
export class ToastComponent {
  @Input() message: string = '';
  @Input() type: 'success' | 'error' = 'success';
  show: boolean = false;

  showToast(message: string, type: 'success' | 'error') {
    console.log('Toast llamado:', message, type);
    this.message = message;
    this.type = type;
    this.show = true;

    setTimeout(() => {
      this.show = false;
    }, 3000);
  }
}
