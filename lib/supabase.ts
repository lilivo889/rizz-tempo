import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get Supabase URL and Anon Key from environment variables
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file or app.config.js');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database utility functions
export const db = {
  // Generic query function
  async query(sql: string, params: any[] = []) {
    const { data, error } = await supabase.rpc('execute_sql', {
      query: sql,
      params: params
    });
    
    if (error) throw error;
    return data;
  },

  // Insert function
  async insert(table: string, data: Record<string, any>) {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  },

  // Update function
  async update(table: string, data: Record<string, any>, condition: Record<string, any>) {
    const { data: result, error } = await supabase
      .from(table)
      .update(data)
      .match(condition)
      .select();
    
    if (error) throw error;
    return result;
  },

  // Delete function
  async delete(table: string, condition: Record<string, any>) {
    const { data: result, error } = await supabase
      .from(table)
      .delete()
      .match(condition)
      .select();
    
    if (error) throw error;
    return result;
  },

  // Select function
  async select(table: string, columns: string = '*', condition?: Record<string, any>) {
    let query = supabase.from(table).select(columns);
    
    if (condition) {
      query = query.match(condition);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
};

// Export types for better TypeScript support
export type Database = any; // Define your database types here
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]; 