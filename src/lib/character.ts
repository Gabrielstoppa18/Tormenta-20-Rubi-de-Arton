import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Character, CharacterPower } from '../types/database';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const characterService = {
  async getCharacters(userId: string): Promise<Character[]> {
    const path = 'characters';
    try {
      const q = query(
        collection(db, path),
        where('user_id', '==', userId),
        orderBy('updated_at', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Character[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async getCharacterById(id: string): Promise<Character | null> {
    const path = `characters/${id}`;
    try {
      const docRef = doc(db, 'characters', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Character;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  async createCharacter(character: Partial<Character>): Promise<Character> {
    const path = 'characters';
    try {
      const data = {
        ...character,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, path), data);
      const newDoc = await getDoc(docRef);
      return { id: docRef.id, ...newDoc.data() } as Character;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  },

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
    const path = `characters/${id}`;
    try {
      const docRef = doc(db, 'characters', id);
      
      // Sanitize updates to remove undefined values
      const sanitizedUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const data = {
        ...sanitizedUpdates,
        updated_at: serverTimestamp(),
      };
      await updateDoc(docRef, data);
      const updatedDoc = await getDoc(docRef);
      return { id: docRef.id, ...updatedDoc.data() } as Character;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  async deleteCharacter(id: string): Promise<void> {
    const path = `characters/${id}`;
    try {
      await deleteDoc(doc(db, 'characters', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  async getCharacterPowers(characterId: string): Promise<CharacterPower[]> {
    const path = `characters/${characterId}/powers`;
    try {
      const q = collection(db, 'characters', characterId, 'powers');
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        character_id: characterId,
        ...doc.data()
      })) as CharacterPower[];
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return [];
    }
  },

  async addPowerToCharacter(characterId: string, powerId: string, sourceType: string, levelGained?: number): Promise<CharacterPower> {
    const path = `characters/${characterId}/powers`;
    try {
      const data = {
        power_id: powerId,
        source_type: sourceType,
        level_gained: levelGained,
        created_at: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'characters', characterId, 'powers'), data);
      const newDoc = await getDoc(docRef);
      return { id: docRef.id, character_id: characterId, ...newDoc.data() } as CharacterPower;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
      throw error;
    }
  }
};
