import { NextResponse } from 'next/server';
import { createAdminSupabase } from '../../../../lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;
    if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });

    const supabase = createAdminSupabase();
    if (!supabase) return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });

    const result = await supabase.auth.admin.createUser({ email, password });
    // result may contain user or error depending on supabase-js version
    // normalize response
    // @ts-ignore
    if (result.error) return NextResponse.json({ error: result.error.message || result.error }, { status: 400 });
    // @ts-ignore
    return NextResponse.json({ user: result.user ?? result.data ?? null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? String(err) }, { status: 500 });
  }
}
