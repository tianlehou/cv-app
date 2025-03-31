import { Injectable } from '@angular/core';
import {
  Storage,
  ref,
  uploadBytes,
  listAll,
  getDownloadURL,
  deleteObject,
} from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  constructor(
    private auth: Auth,
    private storage: Storage,
    private firebaseService: FirebaseService
  ) {}

  public formatEmailKey(email: string): string {
    return email.replace(/\./g, '_');
  }

  async uploadUserImage(file: File, email: string): Promise<string> {
    const user = this.auth.currentUser;
    if (user?.email) {
      const userEmailKey = this.formatEmailKey(user.email);
      const storageRef = ref(
        this.storage,
        `cv-app/users/${userEmailKey}/images/${file.name}`
      );
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    }
    throw new Error('User email is not available.');
  }

  async getUserImages(
    userEmailKey: string
  ): Promise<{ url: string; name: string }[]> {
    const user = this.auth.currentUser;
    if (user?.email) {
      const userEmailKey = this.formatEmailKey(user.email);
      const imagesRef = ref(
        this.storage,
        `cv-app/users/${userEmailKey}/images`
      );
      const result = await listAll(imagesRef);
      const urls = await Promise.all(
        result.items.map(async (item) => ({
          url: await getDownloadURL(item),
          name: item.name,
        }))
      );
      return urls;
    }
    return []; // Return an empty array if user email is not available
  }

  async deleteImage(userEmail: string, imageName: string): Promise<void> {
    const imageRef = ref(
      this.storage,
      `cv-app/users/${userEmail}/images/${imageName}`
    );
    return deleteObject(imageRef);
  }
}
