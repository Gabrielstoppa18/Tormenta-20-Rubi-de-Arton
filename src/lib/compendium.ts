import { 
  Races, Origins, GeneralPowerFactory, Translator,
  Arcanist, Warrior, Barbarian, Buccaneer, Bard, Ranger, Knight, 
  Cleric, Druid, Inventor, Rogue, Fighter, Noble, Paladin,
  RoleName
} from 't20-sheet-builder';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc,
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Race, Class, Origin, Power, ClassPower, Character } from '../types/database';
export type { Race, Class, Origin, Power, ClassPower, Character };
import { RACES, POWERS, ORIGINS } from '../data/t20-data';

export const Roles = {
  getAll: () => [
    Arcanist, Warrior, Barbarian, Buccaneer, Bard, Ranger, Knight, 
    Cleric, Druid, Inventor, Rogue, Fighter, Noble, Paladin
  ],
  get: (name: string) => {
    const map: Record<string, any> = {
      [RoleName.arcanist]: Arcanist,
      [RoleName.warrior]: Warrior,
      [RoleName.barbarian]: Barbarian,
      [RoleName.buccaneer]: Buccaneer,
      [RoleName.bard]: Bard,
      [RoleName.ranger]: Ranger,
      [RoleName.knight]: Knight,
      [RoleName.cleric]: Cleric,
      [RoleName.druid]: Druid,
      [RoleName.inventor]: Inventor,
      [RoleName.rogue]: Rogue,
      [RoleName.fighter]: Fighter,
      [RoleName.noble]: Noble,
      [RoleName.paladin]: Paladin,
    };
    return map[name];
  }
};

const sanitizeForFirestore = (data: any): any => {
  if (data === null || data === undefined) return data;
  if (typeof data === 'function') return undefined;
  if (Array.isArray(data)) {
    return data.map(sanitizeForFirestore).filter(v => v !== undefined);
  }
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const key in data) {
      const value = sanitizeForFirestore(data[key]);
      if (value !== undefined) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  return data;
};

export const compendiumService = {
  async getRaces(): Promise<Race[]> {
    try {
      // Try to get from Firestore first
      const querySnapshot = await getDocs(collection(db, 'races'));
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Race));
      }

      // Fallback to local data
      return Object.entries(RACES).map(([id, r]) => ({
        id,
        name: r.name,
        description: r.description,
        abilities: r.abilities.join(', '),
        raw_data: sanitizeForFirestore(r) || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching races:', error);
      return [];
    }
  },

  async getClasses(): Promise<Class[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'classes'));
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));
      }

      const roles = Roles.getAll();
      return roles.map(r => {
        const roleName = (r as any).roleName;
        const name = Translator.getRoleTranslation(roleName);
        const proficiencies = (r as any).proficiencies ? (r as any).proficiencies.join(', ') : '';
        
        return {
          id: roleName,
          name,
          description: `PV Iniciais: ${(r as any).initialLifePoints} + Con | PV/Nível: ${(r as any).lifePointsPerLevel} | PM/Nível: ${(r as any).manaPerLevel} | Proficiências: ${proficiencies}`,
          hp_initial: (r as any).initialLifePoints,
          hp_per_level: (r as any).lifePointsPerLevel,
          mana_per_level: (r as any).manaPerLevel,
          raw_data: sanitizeForFirestore(r) || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Error fetching classes:', error);
      return [];
    }
  },

  async getOrigins(): Promise<Origin[]> {
    try {
      const querySnapshot = await getDocs(collection(db, 'origins'));
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Origin));
      }

      // Fallback to local data
      return Object.entries(ORIGINS).map(([id, o]) => ({
        id,
        name: o.name,
        description: o.description,
        benefits: o.benefits.join(', '),
        raw_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching origins:', error);
      return [];
    }
  },

  async getPowers(type?: string): Promise<Power[]> {
    try {
      let q = query(collection(db, 'powers'));
      if (type) {
        q = query(collection(db, 'powers'), where('power_type', '==', type));
      }
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Power));
      }

      // Fallback to local data
      return POWERS.map(p => ({
        id: p.name.toLowerCase().replace(/\s+/g, '_'),
        name: p.name,
        power_type: p.requirements.some(r => r.startsWith('Raça:')) ? 'Raça' : 'Geral',
        description: p.description,
        requirements: p.requirements.join(', '),
        raw_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching powers:', error);
      return [];
    }
  },

  async getClassPowers(classId: string): Promise<ClassPower[]> {
    try {
      const q = query(collection(db, 'class_powers'), where('class_id', '==', classId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => doc.data() as ClassPower);
    } catch (error) {
      console.error('Error fetching class powers:', error);
      return [];
    }
  },

  async getRaceById(id: string): Promise<Race | null> {
    try {
      const docRef = doc(db, 'races', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Race;
      }
      const races = await this.getRaces();
      return races.find(r => r.id === id || r.name === id) || null;
    } catch (error) {
      return null;
    }
  },

  async getClassById(id: string): Promise<Class | null> {
    try {
      const docRef = doc(db, 'classes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Class;
      }
      const classes = await this.getClasses();
      return classes.find(c => c.id === id || c.name === id) || null;
    } catch (error) {
      return null;
    }
  },

  async getOriginById(id: string): Promise<Origin | null> {
    try {
      const docRef = doc(db, 'origins', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Origin;
      }
      const origins = await this.getOrigins();
      return origins.find(o => o.id === id || o.name === id) || null;
    } catch (error) {
      return null;
    }
  },

  /**
   * Seeds the Firestore database with data from the t20-sheet-builder library.
   * This should be called once to populate the compendium.
   */
  async seedCompendium() {
    console.log('Starting compendium seeding...');
    
    // Seed Races (Always use local RACES for seeding to ensure descriptions/abilities are updated)
    const localRaces = Object.entries(RACES).map(([id, r]) => ({
      id,
      name: r.name,
      description: r.description,
      abilities: r.abilities.join(', '),
      raw_data: sanitizeForFirestore(r) || {},
    }));

    for (const race of localRaces) {
      await setDoc(doc(db, 'races', race.id), {
        ...race,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }

    // Delete races that are no longer in local data
    const existingRaces = await getDocs(collection(db, 'races'));
    for (const raceDoc of existingRaces.docs) {
      if (!RACES[raceDoc.id]) {
        await deleteDoc(doc(db, 'races', raceDoc.id));
        console.log(`Deleted race ${raceDoc.id} from Firestore.`);
      }
    }
    console.log(`Seeded ${localRaces.length} races.`);

    // Seed Classes
    const classes = await this.getClasses();
    for (const cls of classes) {
      await setDoc(doc(db, 'classes', cls.id), {
        ...cls,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
    console.log(`Seeded ${classes.length} classes.`);

    // Seed Origins (Always use local ORIGINS for seeding)
    const localOrigins = Object.entries(ORIGINS).map(([id, o]) => ({
      id,
      name: o.name,
      description: o.description,
      benefits: o.benefits.join(', '),
      raw_data: {},
    }));

    for (const origin of localOrigins) {
      await setDoc(doc(db, 'origins', origin.id), {
        ...origin,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }

    // Delete origins that are no longer in local data
    const existingOrigins = await getDocs(collection(db, 'origins'));
    for (const originDoc of existingOrigins.docs) {
      if (!ORIGINS[originDoc.id]) {
        await deleteDoc(doc(db, 'origins', originDoc.id));
        console.log(`Deleted origin ${originDoc.id} from Firestore.`);
      }
    }
    console.log(`Seeded ${localOrigins.length} origins.`);

    // Seed Powers (Always use local POWERS for seeding)
    const localPowers = POWERS.map(p => {
      let powerType = 'Geral';
      if (p.requirements.some(r => r.startsWith('Raça:'))) powerType = 'Raça';
      if (p.requirements.some(r => r.startsWith('Origem:'))) powerType = 'Origem';

      return {
        id: p.name.toLowerCase().replace(/\s+/g, '_'),
        name: p.name,
        power_type: powerType,
        description: p.description,
        requirements: p.requirements.join(', '),
        raw_data: {},
      };
    });

    for (const power of localPowers) {
      await setDoc(doc(db, 'powers', power.id), {
        ...power,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }

    // Delete powers that are no longer in local data
    const existingPowers = await getDocs(collection(db, 'powers'));
    const localPowerIds = new Set(localPowers.map(p => p.id));
    for (const powerDoc of existingPowers.docs) {
      if (!localPowerIds.has(powerDoc.id)) {
        await deleteDoc(doc(db, 'powers', powerDoc.id));
        console.log(`Deleted power ${powerDoc.id} from Firestore.`);
      }
    }
    console.log(`Seeded ${localPowers.length} powers.`);

    console.log('Compendium seeding complete!');
  }
};
