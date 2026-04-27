import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import type { Roll } from '../types/database';

export const rollService = {
  async logRoll(roll: Omit<Roll, 'id' | 'created_at'>): Promise<void> {
    await addDoc(collection(db, 'rolls'), {
      ...roll,
      created_at: serverTimestamp(),
    });
  },

  subscribeToGroupRolls(groupId: string, callback: (rolls: Roll[]) => void) {
    const q = query(
      collection(db, 'rolls'), 
      where('group_id', '==', groupId),
      orderBy('created_at', 'desc'),
      limit(50)
    );
    
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Roll[]);
    });
  }
};
