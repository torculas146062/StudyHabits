import { Router, Request, Response } from 'express';
import { IHealthRepository } from '../repositories/IHealthRepository';

export function createHealthRouter(
  healthRepository: IHealthRepository
): Router {
  const router = Router();

  router.get('/', async (_req: Request, res: Response) => {
    try {
      await healthRepository.ping();
      res.json({ status: 'ok', database: 'connected' });
    } catch {
      res.status(503).json({ status: 'error', database: 'disconnected' });
    }
  });

  return router;
}
