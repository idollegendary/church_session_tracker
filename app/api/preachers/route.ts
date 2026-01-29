import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { requireAdmin } from '../../../lib/adminAuth';

export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    // Try selecting all columns; if schema cache on supabase side doesn't include avatar_url yet,
    // fall back to selecting known columns to avoid errors like "Could not find the 'avatar_url' column".
    let res = await supabase.from('preachers').select('*').order('created_at', { ascending: true });
    if (res.error) {
      const msg = (res.error.message || '').toLowerCase();
      if (msg.includes('could not find') || msg.includes('avatar_url')) {
        // fallback select without avatar_url
        res = await supabase.from('preachers').select('id,name,created_at').order('created_at', { ascending: true });
      }
    }
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
    return NextResponse.json({ preachers: res.data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { name, avatar_url } = body;
    if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
      // Try inserting with avatar_url; if the column is not yet visible in the schema cache
      // (Supabase/PostgREST may be stale), fall back to inserting without avatar_url.
      let insertRes = await supabase.from('preachers').insert({ name, avatar_url }).select().single();
      if (insertRes.error) {
        const msg = (insertRes.error.message || '').toLowerCase();
        if (msg.includes('could not find') || msg.includes('avatar_url')) {
          // Retry without avatar_url
          insertRes = await supabase.from('preachers').insert({ name }).select().single();
        }
      }
      if (insertRes.error) return NextResponse.json({ error: insertRes.error.message }, { status: 500 });
      return NextResponse.json({ preacher: insertRes.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
