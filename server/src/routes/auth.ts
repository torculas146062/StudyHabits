import { Request, Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import { EmailAlreadyInUseError } from '../errors';
import { AuthService } from '../services/AuthService';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
/** bcrypt only uses the first 72 bytes, so anything longer is rejected outright. */
const MAX_PASSWORD_BYTES = 72;
const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;

type FieldErrors = Partial<Record<'name' | 'email' | 'password', string>>;

type Parsed<T> = { ok: true; value: T } | { ok: false; errors: FieldErrors };

function readString(body: unknown, key: string): string {
  if (typeof body !== 'object' || body === null) {
    return '';
  }

  const value = (body as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function validatePassword(password: string): string | undefined {
  if (!password) {
    return 'Password is required.';
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    return `Password must be ${MAX_PASSWORD_BYTES} bytes or fewer.`;
  }

  return undefined;
}

function parseRegistration(body: unknown): Parsed<{
  name: string;
  email: string;
  password: string;
}> {
  const errors: FieldErrors = {};

  const name = readString(body, 'name').trim();
  if (!name) {
    errors.name = 'Name is required.';
  } else if (name.length > MAX_NAME_LENGTH) {
    errors.name = `Name must be ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  const email = readString(body, 'email').trim();
  if (!email) {
    errors.email = 'Email address is required.';
  } else if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  const password = readString(body, 'password');
  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { name, email, password } };
}

function parseLogin(body: unknown): Parsed<{ email: string; password: string }> {
  const errors: FieldErrors = {};

  const email = readString(body, 'email').trim();
  if (!email) {
    errors.email = 'Email address is required.';
  }

  const password = readString(body, 'password');
  if (!password) {
    errors.password = 'Password is required.';
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: { email, password } };
}

export function createAuthRouter(authService: AuthService): Router {
  const router = Router();

  // Throttle brute-force and credential-stuffing attempts. When running behind
  // a proxy, configure `app.set('trust proxy', ...)` so limits apply per client.
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
  });

  router.post('/register', authLimiter, async (req: Request, res: Response) => {
    const parsed = parseRegistration(req.body);

    if (!parsed.ok) {
      res.status(400).json({ error: 'Validation failed', fields: parsed.errors });
      return;
    }

    try {
      const result = await authService.register(parsed.value);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof EmailAlreadyInUseError) {
        res
          .status(409)
          .json({ error: 'That email address is already registered.' });
        return;
      }

      throw err;
    }
  });

  router.post('/login', authLimiter, async (req: Request, res: Response) => {
    const parsed = parseLogin(req.body);

    if (!parsed.ok) {
      res.status(400).json({ error: 'Validation failed', fields: parsed.errors });
      return;
    }

    const result = await authService.login(parsed.value);

    if (!result) {
      // Deliberately identical to an unknown email, so accounts can't be probed.
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    res.json(result);
  });

  return router;
}
