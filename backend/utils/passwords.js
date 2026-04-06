import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const keyLength = 64;

export const hashPassword = (password) => {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = scryptSync(password, salt, keyLength).toString('hex');
  return `${salt}:${derivedKey}`;
};

export const verifyPassword = (password, storedHash = '') => {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, keyLength);
  const originalKey = Buffer.from(hash, 'hex');

  if (derivedKey.length !== originalKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, originalKey);
};
