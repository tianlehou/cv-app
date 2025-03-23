import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-type-modal',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-type-modal.component.html',
  styleUrls: ['./user-type-modal.component.css'],
})
export class UserTypeModalComponent {
  @ViewChild('userTypeModal', { static: false }) userTypeModal!: ElementRef;

  closeModal() {
    // Cerrar modal de Bootstrap si está presente
    document.body.classList.remove('modal-open'); // Permitir scroll nuevamente
    document.querySelector('.modal-backdrop')?.remove(); // Eliminar fondo gris
    
    // Restaurar el scroll si quedó bloqueado
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
}