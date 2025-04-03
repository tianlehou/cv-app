import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../services/firebase.service';

// Custom components
import { SidebarComponent } from '../../../../components/buttons/sidebar/sidebar.component';

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
    '../../../../components/buttons/custom-button/custom-button.component.css',
  ],
})
export class PrincipalComponent implements OnInit {
  currentUser: any = null;
  userRole: string | null = null;

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
}
