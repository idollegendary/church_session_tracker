import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Clear the admin_token cookie and return a simple JSON response so fetch() callers
  // don't have to follow a redirect (which can cause CORS/redirect issues).
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', path: '/', sameSite: 'lax', maxAge: 0 });
  return res;
}
