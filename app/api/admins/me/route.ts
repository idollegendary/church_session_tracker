import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { requireAdmin } from '../../../../lib/adminAuth';

export async function GET(req: Request) {
  // Return null admin for unauthenticated requests to avoid 401 noise in browser console.
  console.log('[api/admins/me] headers:', Object.fromEntries((req as any).headers?.entries ? (req as any).headers.entries() : []));
  const payload = requireAdmin(req);
  console.log('[api/admins/me] requireAdmin payload:', payload);
  const cacheHeaders = { 'Cache-Control': 'no-store' };
  if (!payload) return NextResponse.json({ admin: null }, { headers: cacheHeaders });
  try {
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'supabase_not_configured' }, { status: 500 });
    const username = (payload as any).username;
    const { data, error } = await supabase.from('admins').select('id, username, display_name, avatar_url').eq('username', username).limit(1).single();
    if (error || !data) return NextResponse.json({ admin: null }, { headers: cacheHeaders });
    return NextResponse.json({ admin: data }, { headers: cacheHeaders });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? String(e) }, { status: 500, headers: cacheHeaders });
  }
}
