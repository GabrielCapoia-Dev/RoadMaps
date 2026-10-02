import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

export const newToken = (): string => randomBytes(32).toString('hex');
export const tokenHash = (token: string): string =>
  createHash('sha256').update(token).digest('hex');
const derive = (password: string, salt: string): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1:${salt}:${(await derive(password, salt)).toString('hex')}`;
}
export async function checkPassword(password: string, encoded?: string): Promise<boolean> {
  const [, salt, hash] = (encoded ?? '').split(':');
  // Missing accounts still perform the same expensive derivation.
  const actual = await derive(password, salt ?? '00000000000000000000000000000000');
  const expected = hash ? Buffer.from(hash, 'hex') : Buffer.alloc(64);
  return actual.length === expected.length && timingSafeEqual(actual, expected) && Boolean(encoded);
}
