import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_LENGTH = 64;

export const LEGACY_DEFAULT_EDITOR_PASSWORD_HASH =
  'scrypt$16384$8$1$c5a06bc2e31c9bae3d2a7e8ca4ba51c0$75c6085dffd0a1b17ed2b922c5d02951a7eb3a94cd3a607984cccf905193c68c29ae3ba7b00677f8133516b4da8ab52a41082ee3f5a8668627ae7f92050e705f';

export function getDefaultEditorPassword() {
  const fromEnv = process.env.DEFAULT_PASSWORD?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : 'password';
}

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const derived = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  }).toString('hex');

  return ['scrypt', SCRYPT_N, SCRYPT_R, SCRYPT_P, salt, derived].join('$');
}

export function verifyPassword(password: string, encodedHash: string) {
  const parts = encodedHash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') {
    return false;
  }

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = parts[4];
  const hashHex = parts[5];

  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p) || !salt || !hashHex) {
    return false;
  }

  const expected = Buffer.from(hashHex, 'hex');
  const derived = scryptSync(password, salt, expected.length, {
    N: n,
    r,
    p
  });

  if (expected.length !== derived.length) {
    return false;
  }

  return timingSafeEqual(expected, derived);
}
