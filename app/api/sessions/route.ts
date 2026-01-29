import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../lib/supabaseServer';
import { requireAdmin } from '../../../lib/adminAuth';

export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const url = new URL(req.url);
    const user_id = url.searchParams.get('user_id');
    const running = url.searchParams.get('running');

    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

    let q = supabase.from('sessions').select('id, user_id, preacher_id, started_at, ended_at, duration, preachers(name)').order('started_at', { ascending: false });
    // If client provided a specific user_id filter, apply it. Otherwise return recent sessions (server will be protected by admin cookie).
    if (user_id) q = q.eq('user_id', user_id);
    if (running === 'true') q = q.is('ended_at', null);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ sessions: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { action } = body;
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

    if (action === 'start') {
      const { user_id, preacher_id } = body;
      // allow server to derive user_id from admin token if client did not provide it
      const uid = user_id ?? (admin as any)?.sub ?? null;
      if (!uid || !preacher_id) return NextResponse.json({ error: 'user_id and preacher_id required' }, { status: 400 });

      // Prevent multiple running sessions for same user
      const { data: existing } = await supabase.from('sessions').select('id, user_id, preacher_id, started_at, ended_at, duration, preachers(name)').eq('user_id', uid).is('ended_at', null).single();
      if (existing) return NextResponse.json({ session: existing });

      const started_at = new Date().toISOString();
      const { data, error } = await supabase
        .from('sessions')
        .insert({ user_id: uid, preacher_id, started_at })
        .select('id, user_id, preacher_id, started_at, ended_at, duration, preachers(name)')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    if (action === 'stop') {
      const { session_id } = body;
      if (!session_id) return NextResponse.json({ error: 'session_id required' }, { status: 400 });
      const ended_at = new Date().toISOString();
      const { data: session } = await supabase.from('sessions').select('*').eq('id', session_id).single();
      const duration = session?.started_at ? Math.floor((new Date(ended_at).getTime() - new Date(session.started_at).getTime()) / 1000) : null;
      const { data, error } = await supabase
        .from('sessions')
        .update({ ended_at, duration })
        .eq('id', session_id)
        .select('id, user_id, preacher_id, started_at, ended_at, duration, preachers(name)')
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ session: data });
    }

    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
