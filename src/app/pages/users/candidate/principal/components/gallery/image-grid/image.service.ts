// image.service.ts
import { Injectable, inject } from '@angular/core';
import { Storage, ref, deleteObject, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { FirebaseService } from '../../../../../../../services/firebase.service';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private storage = inject(Storage);
  private firebase = inject(FirebaseService);

  // Operaciones de upload
  async uploadImage(file: File, userEmailKey: string, progressCallback?: (snapshot: any) => void): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `cv-app/users/${userEmailKey}/gallery-images/gallery-image-${Date.now()}.${ext}`;
    const storageRef = ref(this.storage, path);
    
    const uploadTask = uploadBytesResumable(storageRef, file);
    if (progressCallback) uploadTask.on('state_changed', progressCallback);
    
    await uploadTask;
    return getDownloadURL(uploadTask.snapshot.ref);
  }

  // Operaciones de delete
  async deleteImage(imageUrl: string, userEmail: string): Promise<void> {
    // Eliminar de Storage
    await deleteObject(ref(this.storage, imageUrl));
    
    // Actualizar Firestore
    const userData = await this.firebase.getUserData(this.firebase.formatEmailKey(userEmail));
    const updatedImages = (userData?.profileData?.multimedia?.galleryImages || [])
      .filter((img: string) => img !== imageUrl);
    
    await this.firebase.updateUserData(userEmail, {
      profileData: {
        multimedia: {
          galleryImages: updatedImages
        }
      }
    });
  }
}
