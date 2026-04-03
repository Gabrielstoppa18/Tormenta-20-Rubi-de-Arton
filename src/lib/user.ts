import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from './firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  created_at: any;
  updated_at: any;
  last_login: any;
  bio?: string;
  preferences?: Record<string, any>;
}

export const userService = {
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  },

  async syncProfile(user: any): Promise<void> {
    if (!user) return;
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      const profileData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        updated_at: serverTimestamp(),
        last_login: serverTimestamp(),
      };

      if (!docSnap.exists()) {
        await setDoc(docRef, {
          ...profileData,
          created_at: serverTimestamp(),
        });
      } else {
        await updateDoc(docRef, profileData);
      }
    } catch (error) {
      console.error('Error syncing user profile:', error);
    }
  },

  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const docRef = doc(db, 'users', uid);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};
