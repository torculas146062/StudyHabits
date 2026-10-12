import jwt from 'jsonwebtoken';

const JWT_ALGORITHM = 'HS256';
const MIN_SECRET_LENGTH = 32;
const DEFAULT_EXPIRES_IN = '7d';

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

function getSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'JWT_SECRET is not set. Copy .env.example to .env and provide a long random value.'
    );
  }

  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters long.`
    );
  }

  return secret;
}

/** Fails fast when auth is misconfigured; call this at startup. */
export function assertAuthConfig(): void {
  getSecret();
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: (process.env.JWT_EXPIRES_IN ??
      DEFAULT_EXPIRES_IN) as jwt.SignOptions['expiresIn'],
  });
}

/**
 * Verifies a bearer token and returns its payload. Throws when the token is
 * malformed, expired, or signed with another secret.
 */
export function verifyAuthToken(token: string): AuthTokenPayload {
  const payload = jwt.verify(token, getSecret(), {
    algorithms: [JWT_ALGORITHM],
  });

  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Token payload is not an object');
  }

  const { sub, email } = payload as jwt.JwtPayload;

  if (typeof sub !== 'string' || typeof email !== 'string') {
    throw new Error('Token payload is missing claims');
  }

  return { sub, email };
}
