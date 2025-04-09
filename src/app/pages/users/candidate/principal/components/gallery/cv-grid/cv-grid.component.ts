import { Component, ChangeDetectorRef, Input, OnInit } from '@angular/core';
import { User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { CvInfoBarComponent } from './cv-info-bar/cv-info-bar.component';
import { CvEditButtonComponent } from './cv-edit-button/cv-edit-button.component';
import { EditAboutMeComponent } from './cv-edit-button/components/edit-about-me/edit-about-me.component';
import { EditAcademicFormationComponent } from './cv-edit-button/components/edit-academic-formation/edit-academic-formation.component';
import { EditExperienceComponent } from './cv-edit-button/components/edit-experience/edit-experience.component';
import { EditLanguagesComponent } from './cv-edit-button/components/edit-languages/edit-languages.component';
import { EditPersonalDataComponent } from './cv-edit-button/components/edit-personal-data/edit-personal-data.component';
import { EditProfilePictureComponent } from './cv-edit-button/components/edit-profile-picture/edit-profile-picture.component';
import { EditSkillsComponent } from './cv-edit-button/components/edit-skills/edit-skills.component';

@Component({
  selector: 'app-cv-grid',
  standalone: true,
  imports: [
    CommonModule,
    CvInfoBarComponent,
    CvEditButtonComponent,
    EditAboutMeComponent,
    EditAcademicFormationComponent,
    EditExperienceComponent,
    EditLanguagesComponent,
    EditPersonalDataComponent,
    EditProfilePictureComponent,
    EditSkillsComponent,
  ],
  templateUrl: './cv-grid.component.html',
  styleUrls: ['./cv-grid.component.css'],
})
export class CvGridComponent implements OnInit {
  @Input() currentUser: User | null = null;
  userEmailKey: string | null = null;
  selectedComponent: string | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.currentUser?.email) {
      this.userEmailKey = this.formatEmailKey(this.currentUser.email);
    }
  }

  private formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  onOptionSelected(option: string) {
    this.selectedComponent = option;
    this.cdr.detectChanges();
  }

  shouldShowComponent(componentName: string): boolean {
    return (
      this.selectedComponent === componentName ||
      this.selectedComponent === null
    );
  }
}
