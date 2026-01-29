import { NextRequest, NextResponse } from 'next/server';

async function verifyJwtEdge(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const encoder = new TextEncoder();
    const secret = (process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '') as string;
    if (!secret) return null;
    const keyData = encoder.encode(secret);
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const data = encoder.encode(`${h}.${p}`);
    // decode base64url signature
    const pad = s.length % 4 === 0 ? s : s + '='.repeat(4 - (s.length % 4));
    const b64 = pad.replace(/-/g, '+').replace(/_/g, '/');
    const sig = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', cryptoKey, sig, data);
    if (!ok) return null;
    const payload = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_token')?.value;
    // Allow logout endpoint to pass through without requiring a valid token
    if (req.nextUrl.pathname === '/api/admins/logout') {
      return NextResponse.next();
    }
    // Allow login endpoint to pass through so users can obtain a new token
    if (req.nextUrl.pathname === '/api/admins/login') {
      return NextResponse.next();
    }
    console.log('[middleware] cookie header:', req.headers.get('cookie'));
    if (token) {
      console.log('[middleware] admin_token present, prefix:', token.slice(0, 8));
      // verify token in Edge runtime
      const payload = await verifyJwtEdge(token);
      console.log('[middleware] verifyJwtEdge payload:', payload);
      if (!payload) {
        // invalid token: for API return 401, for UI redirect to login
        if (req.nextUrl.pathname.startsWith('/api')) {
          console.log('[middleware] invalid token for API, returning 401');
          return new NextResponse(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const login = new URL('/login', req.url);
        console.log('[middleware] invalid token for UI, redirecting to /login');
        return NextResponse.redirect(login);
      }
      // attach authorization header for downstream Node handlers
      const headers = new Headers(req.headers);
      headers.set('authorization', `Bearer ${token}`);
      console.log('[middleware] attaching authorization header for downstream');
      return NextResponse.next({ request: { headers } });
    }
    // no token: protect UI pages under /preachers, /timer, /sessions, /profile
    const protectedUI = ['/preachers', '/timer', '/sessions', '/profile'];
    if (protectedUI.some(p => req.nextUrl.pathname.startsWith(p))) {
      const login = new URL('/login', req.url);
      return NextResponse.redirect(login);
    }
  } catch (e) {
    // ignore and continue
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*', '/preachers/:path*', '/preachers', '/timer', '/sessions', '/profile']
};
