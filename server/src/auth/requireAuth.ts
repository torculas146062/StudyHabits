import { NextFunction, Request, Response } from 'express';

import { verifyAuthToken } from './token';

/**
 * Guards routes that act on the signed-in user's data. The verified id is put
 * on `res.locals` so handlers do not have to re-parse the token.
 */
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }

  try {
    const userId = Number(verifyAuthToken(token).sub);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Token subject is not a user id');
    }

    res.locals.userId = userId;
    next();
  } catch {
    // Expired, forged and malformed tokens all get the same answer.
    res.status(401).json({ error: 'Invalid or expired session.' });
  }
}

export function currentUserId(res: Response): number {
  return res.locals.userId as number;
}
