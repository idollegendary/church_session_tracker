import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { requireAdmin } from '../../../../lib/adminAuth';

type StatRow = {
  preacher_id: string;
  name?: string;
  avatar_url?: string;
  total_seconds: number;
  session_count: number;
};

export async function GET(req: Request) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get('days') ?? '30');
    const limit = Math.min(100, Number(url.searchParams.get('limit') ?? '10'));

    const since = new Date(Date.now() - Math.max(0, days) * 24 * 60 * 60 * 1000).toISOString();

    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

    const { data, error } = await supabase
      .from('sessions')
      .select('preacher_id, duration, preachers(id,name,avatar_url)')
      .gte('started_at', since);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as any[];
    const map = new Map<string, StatRow>();
    for (const r of rows) {
      const id = r.preacher_id ?? 'unknown';
      const existing = map.get(id) ?? { preacher_id: id, name: r?.preachers?.name, avatar_url: r?.preachers?.avatar_url, total_seconds: 0, session_count: 0 };
      existing.total_seconds += typeof r.duration === 'number' ? r.duration : 0;
      existing.session_count += 1;
      if (!existing.name && r?.preachers?.name) existing.name = r.preachers.name;
      if (!existing.avatar_url && r?.preachers?.avatar_url) existing.avatar_url = r.preachers.avatar_url;
      map.set(id, existing);
    }

    const stats = Array.from(map.values()).sort((a, b) => b.total_seconds - a.total_seconds).slice(0, limit);

    return NextResponse.json({ stats, range: { days, since } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
