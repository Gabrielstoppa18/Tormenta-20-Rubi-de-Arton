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
  serverTimestamp,
  onSnapshot,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db, auth } from './firebase';
import type { Group, Character } from '../types/database';

export const groupService = {
  async createGroup(name: string, userId: string): Promise<Group> {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const data = {
      name,
      owner_id: userId,
      members: [userId],
      invite_code: inviteCode,
      created_at: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'groups'), data);
    const newDoc = await getDoc(docRef);
    return { id: docRef.id, ...newDoc.data() } as Group;
  },

  async joinGroupByCode(inviteCode: string, userId: string): Promise<Group | null> {
    const q = query(collection(db, 'groups'), where('invite_code', '==', inviteCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) return null;
    
    const groupDoc = querySnapshot.docs[0];
    const groupRef = doc(db, 'groups', groupDoc.id);
    
    await updateDoc(groupRef, {
      members: arrayUnion(userId)
    });
    
    const updatedDoc = await getDoc(groupRef);
    return { id: groupDoc.id, ...updatedDoc.data() } as Group;
  },

  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      members: arrayRemove(userId)
    });
  },

  async getGroups(userId: string): Promise<Group[]> {
    const q = query(collection(db, 'groups'), where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Group[];
  },

  subscribeToGroup(groupId: string, callback: (group: Group) => void) {
    return onSnapshot(doc(db, 'groups', groupId), (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() } as Group);
      }
    });
  },

  async getGroupMembers(groupId: string): Promise<Character[]> {
    const q = query(collection(db, 'characters'), where('group_id', '==', groupId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Character[];
  },

  subscribeToGroupMembers(groupId: string, callback: (members: Character[]) => void) {
    const q = query(collection(db, 'characters'), where('group_id', '==', groupId));
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Character[]);
    });
  }
};
