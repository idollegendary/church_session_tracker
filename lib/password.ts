import { randomBytes, pbkdf2Sync } from 'crypto';

const ITERATIONS = 100_000;
const KEYLEN = 64;
const DIGEST = 'sha512';

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, salt: string, hash: string) {
  const computed = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST).toString('hex');
  return computed === hash;
}
