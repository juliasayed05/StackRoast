import { createHmac, timingSafeEqual } from 'node:crypto';

export function hashUserId(userId) {
  return createHmac('sha256', process.env.JWT_SECRET)
    .update(String(userId))
    .digest('hex');
}

export function matchesUserHash(storedHash, userId) {
  if (!storedHash || !userId) return false;
  const expected = Buffer.from(hashUserId(userId), 'hex');
  let actual;
  try {
    actual = Buffer.from(storedHash, 'hex');
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
