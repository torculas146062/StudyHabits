import { Request, Response, Router } from 'express';

import { currentUserId, requireAuth } from '../auth/requireAuth';
import { AuthService } from '../services/AuthService';

export function createAccountRouter(authService: AuthService): Router {
  const router = Router();

  router.use(requireAuth);

  /**
   * Deletes the signed-in account. The study plan is removed by the
   * `ON DELETE CASCADE` foreign key, so no client has to clean it up first.
   */
  router.delete('/', async (_req: Request, res: Response) => {
    const deleted = await authService.deleteAccount(currentUserId(res));

    if (!deleted) {
      // The token was valid but the account is already gone.
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    res.status(204).end();
  });

  return router;
}
