import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../../../services/firebase.service';

// components
import { CustomButtonComponent } from '../../../../components/buttons/custom-button/custom-button.component';
import { EditProfilePictureComponent } from './components/edit-profile-picture/edit-profile-picture.component';
import { EditPersonalDataComponent } from './components/edit-personal-data/edit-personal-data.component';
import { EditExperienceComponent } from './components/edit-experience/edit-experience.component';
import { EditAboutMeComponent } from './components/edit-about-me/edit-about-me.component';
import { EditAcademicFormationComponent } from './components/edit-academic-formation/edit-academic-formation.component';
import { EditLanguagesComponent } from './components/edit-languages/edit-languages.component';
import { EditSkillsComponent } from './components/edit-skills/edit-skills.component';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    RouterModule,
    CommonModule,
    CustomButtonComponent,

    EditProfilePictureComponent,
    EditPersonalDataComponent,
    EditExperienceComponent,
    EditAboutMeComponent,
    EditAcademicFormationComponent,
    EditLanguagesComponent,
    EditSkillsComponent,
  ],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css'],
})
export class EditProfileComponent implements OnInit {
  currentUser: any = null;
  userRole: string | null = null;

  constructor(private firebaseService: FirebaseService) {}

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