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
  notes?: string;
  created_at: string;
  updated_at: string;
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
