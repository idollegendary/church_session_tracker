import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;

// Return a singleton Supabase client in the browser to avoid multiple GoTrue instances.
export function createSupabaseClient(): SupabaseClient | null {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (_supabase) return _supabase;
  _supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true } });
  return _supabase;
}
