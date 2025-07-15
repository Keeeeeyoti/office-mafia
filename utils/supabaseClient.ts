import { createClient } from '@supabase/supabase-js';

// These will be set as environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // For now, we'll use localStorage for persistence
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types (updated to match our schema)
export interface Database {
  public: {
    Tables: {
      games: {
        Row: {
          id: string;
          created_at: string;
          status: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
          host_id: string;
          current_phase: 'lobby' | 'night' | 'day' | 'voting' | 'end';
          game_code: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          status?: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
          host_id: string;
          current_phase?: 'lobby' | 'night' | 'day' | 'voting' | 'end';
          game_code?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          status?: 'waiting' | 'in_progress' | 'completed' | 'abandoned';
          host_id?: string;
          current_phase?: 'lobby' | 'night' | 'day' | 'voting' | 'end';
          game_code?: string;
        };
      };
      players: {
        Row: {
          id: string;
          game_id: string;
          name: string;
          role: 'employee' | 'rogue' | 'audit' | 'hr' | null;
          is_alive: boolean;
          joined_at: string;
          is_host: boolean;
        };
        Insert: {
          id?: string;
          game_id: string;
          name: string;
          role?: 'employee' | 'rogue' | 'audit' | 'hr' | null;
          is_alive?: boolean;
          joined_at?: string;
          is_host?: boolean;
        };
        Update: {
          id?: string;
          game_id?: string;
          name?: string;
          role?: 'employee' | 'rogue' | 'audit' | 'hr' | null;
          is_alive?: boolean;
          joined_at?: string;
          is_host?: boolean;
        };
      };
      game_events: {
        Row: {
          id: string;
          game_id: string;
          event_type: string;
          event_data: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          event_type: string;
          event_data?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          event_type?: string;
          event_data?: any;
          created_at?: string;
        };
      };
    };
  };
}

export type GameStatus = Database['public']['Tables']['games']['Row']['status'];
export type GamePhase = Database['public']['Tables']['games']['Row']['current_phase'];
export type PlayerRole = Database['public']['Tables']['players']['Row']['role'];
export type Game = Database['public']['Tables']['games']['Row'];
export type Player = Database['public']['Tables']['players']['Row'];
export type GameEvent = Database['public']['Tables']['game_events']['Row']; 