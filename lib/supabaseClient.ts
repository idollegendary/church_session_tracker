import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let _supabase: SupabaseClient | null = null;

// Return a singleton Supabase client in the browser to avoid multiple GoTrue instances.
// Uses dynamic import so the heavy `@supabase/supabase-js` bundle isn't pulled into
// any module that merely imports this helper on the client.
export async function createSupabaseClient(): Promise<SupabaseClient | null> {
  if (typeof window === 'undefined') return null;
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (_supabase) return _supabase;
  const mod = await import('@supabase/supabase-js');
  const { createClient } = mod;
  _supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: true } }) as SupabaseClient;
  return _supabase;
}
