import { createHmac } from 'crypto';

function base64url(input: string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJwt(payload: Record<string, any>, secret: string, opts: { expSeconds?: number } = {}) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = opts.expSeconds ? Math.floor(Date.now() / 1000) + opts.expSeconds : undefined;
  const full = { ...payload } as Record<string, any>;
  if (exp) full.exp = exp;
  const headerB = base64url(JSON.stringify(header));
  const payloadB = base64url(JSON.stringify(full));
  const toSign = `${headerB}.${payloadB}`;
  const sig = createHmac('sha256', secret).update(toSign).digest('base64');
  const sigB = sig.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${toSign}.${sigB}`;
}

export function verifyJwt(token: string, secret: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, s] = parts;
    const toSign = `${h}.${p}`;
    const sig = createHmac('sha256', secret).update(toSign).digest('base64');
    const sigB = sig.replace(/=+$/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    if (sigB !== s) return null;
    const payload = JSON.parse(Buffer.from(p, 'base64').toString('utf8'));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch (err) {
    return null;
  }
}
