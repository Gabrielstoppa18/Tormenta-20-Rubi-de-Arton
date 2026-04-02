import { supabase } from './supabase';
import type { Character, CharacterPower } from '../types/database';

export const characterService = {
  async getCharacters(userId: string): Promise<Character[]> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getCharacterById(id: string): Promise<Character | null> {
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async createCharacter(character: Partial<Character>): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .insert([character])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCharacter(id: string, updates: Partial<Character>): Promise<Character> {
    const { data, error } = await supabase
      .from('characters')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCharacter(id: string): Promise<void> {
    const { error } = await supabase
      .from('characters')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getCharacterPowers(characterId: string): Promise<CharacterPower[]> {
    const { data, error } = await supabase
      .from('character_powers')
      .select(`
        *,
        power:powers(*)
      `)
      .eq('character_id', characterId);
    if (error) throw error;
    return data || [];
  },

  async addPowerToCharacter(characterId: string, powerId: string, sourceType: string, levelGained?: number): Promise<CharacterPower> {
    const { data, error } = await supabase
      .from('character_powers')
      .insert([{
        character_id: characterId,
        power_id: powerId,
        source_type: sourceType,
        level_gained: levelGained
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
