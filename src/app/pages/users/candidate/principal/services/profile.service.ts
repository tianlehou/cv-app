// profile-picture.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  // obtener la url de la imagen de perfil
  private profilePictureUpdated = new BehaviorSubject<string | null>(null);
  profilePictureUpdated$ = this.profilePictureUpdated.asObservable();
  // notificar la url de la imagen de perfil
  notifyProfilePictureUpdate(newUrl: string | null): void {
    this.profilePictureUpdated.next(newUrl);
  }

  // obtener la url de personal-data
  private personalDataUpdated = new BehaviorSubject<any>(null);
  personalDataUpdated$ = this.personalDataUpdated.asObservable();
  // notificar la url de personal-data
  notifyPersonalDataUpdate(updatedData: any): void {
    this.personalDataUpdated.next(updatedData);
  }
}
