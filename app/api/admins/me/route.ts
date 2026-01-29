import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { requireAdmin } from '../../../../lib/adminAuth';

export async function GET(req: Request) {
  // Return null admin for unauthenticated requests to avoid 401 noise in browser console.
  const payload = requireAdmin(req);
  if (!payload) return NextResponse.json({ admin: null });
  try {
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
    const username = (payload as any).username;
    const { data, error } = await supabase.from('admins').select('id, username, display_name, avatar_url').eq('username', username).limit(1).single();
    if (error || !data) return NextResponse.json({ admin: null });
    return NextResponse.json({ admin: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500 });
  }
}
