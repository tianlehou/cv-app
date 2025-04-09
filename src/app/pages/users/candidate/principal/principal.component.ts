import { Component, OnInit, HostListener, ViewChild, ElementRef, AfterViewInit} from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../shared/services/firebase.service';

// Custom components
import { SidebarComponent } from '../../../../shared/components/buttons/sidebar/sidebar.component';

// Components
import { ProfilePictureComponent } from './components/profile-picture/profile-picture.component';
import { PersonalDataComponent } from './components/personal-data/personal-data.component';
import { GalleryComponent } from './components/gallery/gallery.component';
@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    SidebarComponent,
    ProfilePictureComponent,
    PersonalDataComponent,
    GalleryComponent
  ],
  templateUrl: './principal.component.html',
  styleUrls: [
    './principal.component.css',
    './back-to-top.component.css',
    '../../../../shared/components/buttons/custom-button/custom-button.component.css',
  ],
})
export class PrincipalComponent implements OnInit, AfterViewInit {
  currentUser: any = null;
  userRole: string | null = null;
  @ViewChild('profileContainer') profileContainer!: ElementRef;
  showBackToTop = false;

  constructor(private firebaseService: FirebaseService) {} // Inyecta el servicio

  async ngOnInit(): Promise<void> {

    // Usa el método del servicio para obtener el estado de autenticación
    this.firebaseService
      .isAuthenticated()
      .subscribe(async (isAuthenticated) => {
        if (isAuthenticated) {
          this.currentUser = await this.firebaseService.getCurrentUser();
          console.log('Usuario autenticado:', this.currentUser.email);

          // Obtener el rol usando firebase.service
          const userData = await this.firebaseService.getUserData(
            this.currentUser.email.replace(/\./g, '_')
          );
          this.userRole = userData?.role || null;
          console.log('Rol del usuario:', this.userRole);
        } else {
          console.error('Usuario no autenticado.');
        }
      });
  }

  ngAfterViewInit() {
    this.checkScrollPosition();
  }

  @HostListener('window:scroll')
  onWindowScroll() {
    this.checkScrollPosition();
  }

  checkScrollPosition() {
    if (this.profileContainer) {
      const container = this.profileContainer.nativeElement;
      const containerRect = container.getBoundingClientRect();
      const containerBottom = containerRect.bottom;
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY || window.pageYOffset;

      // Mostrar el botón cuando el usuario haya llegado al final del componente
      const componentHeight = containerRect.height;
      const triggerPoint = componentHeight * 0.7; // Mostrar después del 70% del componente
      
      this.showBackToTop = containerBottom <= windowHeight + 100;
    }
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
}