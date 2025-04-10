// profile-picture.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProfilePictureService {
  private profilePictureUpdated = new BehaviorSubject<string | null>(null);
  profilePictureUpdated$ = this.profilePictureUpdated.asObservable();

  notifyProfilePictureUpdate(newUrl: string | null): void {
    this.profilePictureUpdated.next(newUrl);
  }
}