import { verifyJwt } from './jwt';

export function requireAdmin(req: Request) {
  try {
    const auth = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!auth) return null;
    const parts = auth.split(' ');
    const token = parts.length === 2 && parts[0].toLowerCase() === 'bearer' ? parts[1] : parts[0];
    const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!secret) return null;
    const payload = verifyJwt(token, secret);
    return payload;
  } catch (e) {
    return null;
  }
}

