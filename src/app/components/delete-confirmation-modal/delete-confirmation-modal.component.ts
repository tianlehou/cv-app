import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './delete-confirmation-modal.component.html',
  styleUrls: ['./delete-confirmation-modal.component.css'],
})
export class DeleteConfirmModalComponent implements OnChanges, OnDestroy {
  @Input() title: string = 'Confirmación';
  @Input() message: string = '¿Estás seguro de realizar esta acción?';
  @Input() isVisible: boolean = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  countdown: number = 5;
  isConfirmDisabled: boolean = true;
  private countdownInterval: any;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isVisible'] && changes['isVisible'].currentValue === true) {
      this.startCountdown();
    }
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown() {
    // Clear any existing interval first
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.countdown = 5;
    this.isConfirmDisabled = true;
    
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.isConfirmDisabled = false;
      }
    }, 1000);
  }

  onConfirm(): void {
    if (!this.isConfirmDisabled) {
      this.confirm.emit();
      this.closeModal();
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.closeModal();
  }

  private closeModal(): void {
    this.isVisible = false;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}