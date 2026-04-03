import { 
  Races, Origins, GeneralPowerFactory, Translator,
  Arcanist, Warrior, Barbarian, Buccaneer, Bard, Ranger, Knight, 
  Cleric, Druid, Inventor, Rogue, Fighter, Noble, Paladin,
  RoleName
} from 't20-sheet-builder';
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

export const compendiumService = {
  async getRaces(): Promise<Race[]> {
    try {
      const races = Races.getAll();
      return races.map(r => ({
        id: (r as any).raceName,
        name: Translator.getRaceTranslation((r as any).raceName),
        description: `Raça: ${Translator.getRaceTranslation((r as any).raceName)}`,
        raw_data: r,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching races from library:', error);
      return [];
    }
  },

  async getClasses(): Promise<Class[]> {
    try {
      const roles = Roles.getAll();
      return roles.map(r => ({
        id: (r as any).roleName,
        name: Translator.getRoleTranslation((r as any).roleName),
        description: `Classe: ${Translator.getRoleTranslation((r as any).roleName)}`,
        hp_initial: (r as any).initialLifePoints,
        hp_per_level: (r as any).lifePointsPerLevel,
        mana_per_level: (r as any).manaPerLevel,
        raw_data: r,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching classes from library:', error);
      return [];
    }
  },

  async getOrigins(): Promise<Origin[]> {
    try {
      const origins = Origins.getAll();
      return origins.map(o => ({
        id: (o as any).originName,
        name: Translator.getOriginTranslation((o as any).originName),
        description: `Origem: ${Translator.getOriginTranslation((o as any).originName)}`,
        raw_data: o,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching origins from library:', error);
      return [];
    }
  },

  async getPowers(type?: string): Promise<Power[]> {
    try {
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
      console.error('Error fetching powers from library:', error);
      return [];
    }
  },

  async getClassPowers(classId: string): Promise<ClassPower[]> {
    try {
      const role = Roles.get(classId as any);
      if (!role) return [];
      
      // The library doesn't easily list class powers by level in the static data
      // This is a simplification
      return [];
    } catch (error) {
      console.error('Error fetching class powers from library:', error);
      return [];
    }
  },

  async getRaceById(id: string): Promise<Race | null> {
    const races = await this.getRaces();
    return races.find(r => r.id === id || r.name === id) || null;
  },

  async getClassById(id: string): Promise<Class | null> {
    const classes = await this.getClasses();
    return classes.find(c => c.id === id || c.name === id) || null;
  },

  async getOriginById(id: string): Promise<Origin | null> {
    const origins = await this.getOrigins();
    return origins.find(o => o.id === id || o.name === id) || null;
  }
};
