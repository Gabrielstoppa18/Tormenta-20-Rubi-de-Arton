export type SourceBook = {
  id: string;
  name: string;
  edition?: string;
  is_official: boolean;
  created_at: string;
};

export type Race = {
  id: string;
  name: string;
  description?: string;
  source_book_id?: string;
  raw_data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type Class = {
  id: string;
  name: string;
  description?: string;
  hp_initial?: number;
  hp_per_level?: number;
  mana_per_level?: number;
  source_book_id?: string;
  raw_data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type Origin = {
  id: string;
  name: string;
  description?: string;
  source_book_id?: string;
  raw_data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type Power = {
  id: string;
  name: string;
  power_type: string;
  description?: string;
  requirement_text?: string;
  source_book_id?: string;
  raw_data: Record<string, any>;
  created_at: string;
  updated_at: string;
};

export type ClassPower = {
  class_id: string;
  power_id: string;
  level_required: number;
  is_choice: boolean;
  display_order?: number;
  power?: Power; // Joined data
};

export type Spell = {
  id: string;
  name: string;
  circle: number;
  school: string;
  execution: string;
  range: string;
  target: string;
  duration: string;
  resistance?: string;
  description: string;
  type: "Arcana" | "Divina" | "Universal";
  enhancements?: { cost: number; description: string }[];
  created_at: string;
  updated_at: string;
};

export type Character = {
  id: string;
  user_id: string;
  name: string;
  race_id?: string;
  class_id?: string;
  origin_id?: string;
  level: number;
  attributes_base: Record<string, number>;
  current_hp?: number;
  current_mp?: number;
  group_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  name: string;
  owner_id: string;
  members: string[];
  invite_code: string;
  created_at: any;
};

export type Roll = {
  id: string;
  user_id: string;
  character_name: string;
  group_id: string;
  label: string;
  result: number;
  bonus: number;
  is_critical: boolean;
  is_fail: boolean;
  created_at: any;
};

export type CharacterPower = {
  id: string;
  character_id: string;
  power_id: string;
  source_type: 'race' | 'class' | 'origin' | 'general' | 'granted' | 'manual';
  source_ref?: string;
  level_gained?: number;
  notes?: string;
  created_at: string;
  power?: Power; // Joined data
};

export interface Database {
  public: {
    Tables: {
      characters: {
        Row: Character;
        Insert: Partial<Character>;
        Update: Partial<Character>;
      };
      classes: {
        Row: Class;
        Insert: Partial<Class>;
        Update: Partial<Class>;
      };
      races: {
        Row: Race;
        Insert: Partial<Race>;
        Update: Partial<Race>;
      };
      origins: {
        Row: Origin;
        Insert: Partial<Origin>;
        Update: Partial<Origin>;
      };
      powers: {
        Row: Power;
        Insert: Partial<Power>;
        Update: Partial<Power>;
      };
      character_powers: {
        Row: CharacterPower;
        Insert: Partial<CharacterPower>;
        Update: Partial<CharacterPower>;
      };
      spells: {
        Row: Spell;
        Insert: Partial<Spell>;
        Update: Partial<Spell>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
