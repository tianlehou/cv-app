import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../services/firebase.service';

// Components
import { CustomButtonComponent } from '../../../../shared/components/buttons/custom-button/custom-button.component';
import { ProfilePictureComponent } from './components/profile-picture/profile-picture.component';
import { PersonalDataComponent } from './components/personal-data/personal-data.component';

// Custom components
import { SidebarComponent } from '../../../../shared/components/buttons/sidebar/sidebar.component';
@Component({
  selector: 'app-principal',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    CustomButtonComponent,
    SidebarComponent,
    ProfilePictureComponent,
    PersonalDataComponent,
  ],
  templateUrl: './principal.component.html',
  styleUrls: ['./principal.component.css'],
})
export class PrincipalComponent implements OnInit {
  currentUser: any = null; // Usa el tipo correcto según tu aplicación
  userRole: string | null = null;

  constructor(private firebaseService: FirebaseService) {} // Inyecta el servicio

  async ngOnInit(): Promise<void> {
    // Usa el método del servicio para obtener el estado de autenticación
    this.firebaseService.isAuthenticated().subscribe(async (isAuthenticated) => {
      if (isAuthenticated) {
        this.currentUser = await this.firebaseService.getCurrentUser();
        console.log('Usuario autenticado:', this.currentUser.email);

        // Obtener el rol usando el servicio
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