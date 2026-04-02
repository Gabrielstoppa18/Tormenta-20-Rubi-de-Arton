import { supabase } from './supabase';
import type { Race, Class, Origin, Power, ClassPower } from '../types/database';

export const compendiumService = {
  async getRaces(): Promise<Race[]> {
    const { data, error } = await supabase
      .from('races')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getClasses(): Promise<Class[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getOrigins(): Promise<Origin[]> {
    const { data, error } = await supabase
      .from('origins')
      .select('*')
      .order('name');
    if (error) throw error;
    return data || [];
  },

  async getPowers(type?: string): Promise<Power[]> {
    let query = supabase.from('powers').select('*').order('name');
    if (type) {
      query = query.eq('power_type', type);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getClassPowers(classId: string): Promise<ClassPower[]> {
    const { data, error } = await supabase
      .from('class_powers')
      .select(`
        *,
        power:powers(*)
      `)
      .eq('class_id', classId)
      .order('level_required')
      .order('display_order');
    if (error) throw error;
    return data || [];
  },

  async getRaceById(id: string): Promise<Race | null> {
    const { data, error } = await supabase
      .from('races')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getClassById(id: string): Promise<Class | null> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async getOriginById(id: string): Promise<Origin | null> {
    const { data, error } = await supabase
      .from('origins')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }
};
