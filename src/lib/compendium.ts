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
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import type { Race, Class, Origin, Power, ClassPower } from '../types/database';

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

      // Fallback to library
      const races = Races.getAll();
      return races.map(r => {
        const raceName = (r as any).raceName;
        const name = Translator.getRaceTranslation(raceName);
        const abilities = (r as any).abilities ? Object.values((r as any).abilities).map((a: any) => a.name).join(', ') : '';
        
        return {
          id: raceName,
          name,
          description: `Habilidades de Raça: ${abilities}`,
          raw_data: sanitizeForFirestore(r) || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
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

      const origins = Origins.getAll();
      return origins.map(o => {
        const originName = (o as any).originName;
        const name = Translator.getOriginTranslation(originName);
        
        return {
          id: originName,
          name,
          description: `Origem: ${name}. Concede perícias e poderes únicos.`,
          raw_data: sanitizeForFirestore(o) || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
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

      const powerNames = Object.keys(GeneralPowerFactory.generalPowerClasses);
      return powerNames.map(name => ({
        id: name,
        name: Translator.getPowerTranslation(name as any) || name,
        power_type: 'Geral',
        description: `Poder Geral: ${Translator.getPowerTranslation(name as any) || name}`,
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
    
    // Seed Races
    const races = await this.getRaces();
    for (const race of races) {
      await setDoc(doc(db, 'races', race.id), {
        ...race,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
    console.log(`Seeded ${races.length} races.`);

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

    // Seed Origins
    const origins = await this.getOrigins();
    for (const origin of origins) {
      await setDoc(doc(db, 'origins', origin.id), {
        ...origin,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
    console.log(`Seeded ${origins.length} origins.`);

    // Seed General Powers
    const powers = await this.getPowers();
    for (const power of powers) {
      await setDoc(doc(db, 'powers', power.id), {
        ...power,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    }
    console.log(`Seeded ${powers.length} general powers.`);

    console.log('Compendium seeding complete!');
  }
};
