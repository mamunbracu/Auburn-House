/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';
import { AppState } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

const TABLE_NAME = 'house_data';
const ROW_ID = 'auburn_house_v1';

export const supabaseService = {
  isEnabled: () => !!supabase,

  loadState: async (): Promise<AppState | null> => {
    if (!supabase) return null;
    
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('state')
      .eq('id', ROW_ID)
      .single();

    if (error) {
      console.error('Supabase: Load failed', error);
      return null;
    }
    return data?.state as AppState;
  },

  saveState: async (state: AppState) => {
    if (!supabase) return;

    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({ id: ROW_ID, state, updated_at: new Date().toISOString() });

    if (error) {
      console.error('Supabase: Save failed', error);
    }
  },

  clearState: async () => {
    if (!supabase) return;
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', ROW_ID);
    
    if (error) {
      console.error('Supabase: Clear failed', error);
    }
  },

  subscribe: (onUpdate: (newState: AppState) => void) => {
    if (!supabase) return () => {};

    const channel = supabase
      .channel(`public:${TABLE_NAME}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: TABLE_NAME, filter: `id=eq.${ROW_ID}` },
        (payload) => {
          if (payload.new && payload.new.state) {
            onUpdate(payload.new.state as AppState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
