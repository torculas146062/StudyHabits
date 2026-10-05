import express, { Express, NextFunction, Request, Response } from 'express';
import { IHealthRepository } from './repositories/IHealthRepository';
import { createHealthRouter } from './routes/health';

export function createApp(healthRepository: IHealthRepository): Express {
  const app = express();

  app.use(express.json());

  app.use('/health', createHealthRouter(healthRepository));

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app;
}
