import { NextRequest, NextResponse } from 'next/server';
import { getServerSupabase } from '../../../../lib/supabaseServer';
import { verifyPassword } from '../../../../lib/password';
import { signJwt } from '../../../../lib/jwt';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body || {};
    if (!username || !password) {
      return NextResponse.json({ error: 'missing_credentials' }, { status: 400 });
    }

    const supabase = getServerSupabase();
    if (!supabase) return NextResponse.json({ error: 'server_error' }, { status: 500 });
    const { data, error } = await supabase
      .from('admins')
      .select('id, password_salt, password_hash')
      .eq('username', username)
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });
    }

    const ok = verifyPassword(password, data.password_salt, data.password_hash);
    if (!ok) return NextResponse.json({ error: 'invalid_credentials' }, { status: 401 });

    const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const token = signJwt({ sub: data.id, username }, secret, { expSeconds: 60 * 60 * 24 });

    const res = NextResponse.json({ ok: true });
    res.cookies.set('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
    return res;
  } catch (err) {
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}
