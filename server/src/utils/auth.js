import jwt from 'jsonwebtoken';

export function signAuthToken(userId) {
  return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'stackroast-api',
    audience: 'stackroast-client',
  });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET, {
    issuer: 'stackroast-api',
    audience: 'stackroast-client',
  });
}
