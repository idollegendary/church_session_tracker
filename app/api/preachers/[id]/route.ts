import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { requireAdmin } from '../../../../lib/adminAuth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { id } = params;
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    // Try selecting all columns, fallback if schema cache is stale on Supabase side
    let res = await supabase.from('preachers').select('*').eq('id', id).single();
    if (res.error) {
      const msg = (res.error.message || '').toLowerCase();
      if (msg.includes('could not find') || msg.includes('avatar_url')) {
        res = await supabase.from('preachers').select('id,name,created_at').eq('id', id).single();
      }
    }
    if (res.error) return NextResponse.json({ error: res.error.message }, { status: 404 });
    return NextResponse.json({ preacher: res.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { id } = params;
    const body = await req.json();
    const { name, avatar_url } = body;
    if (!name && avatar_url === undefined) return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    // Try updating including avatar_url if provided. If schema cache is stale and update fails
    // due to unknown column, retry without avatar_url.
    const updates: any = {};
    if (name) updates.name = name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    let updRes = await supabase.from('preachers').update(updates).eq('id', id).select().single();
    if (updRes.error) {
      const msg = (updRes.error.message || '').toLowerCase();
      if (msg.includes('could not find') || msg.includes('avatar_url')) {
        // Retry only with name
        const smallUpdates: any = {};
        if (name) smallUpdates.name = name;
        updRes = await supabase.from('preachers').update(smallUpdates).eq('id', id).select().single();
      }
    }
    if (updRes.error) return NextResponse.json({ error: updRes.error.message }, { status: 500 });
    return NextResponse.json({ preacher: updRes.data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const admin = requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  try {
    const { id } = params;
    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

    // Fetch preacher record
    const { data: preacher, error: fetchErr } = await supabase.from('preachers').select('*').eq('id', id).single();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 404 });

    // Delete DB row
    const { error } = await supabase.from('preachers').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // We don't store files for avatar (URL-based), nothing to delete from storage.

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
