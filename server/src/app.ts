import express, { Express, NextFunction, Request, Response } from 'express';
import { IHealthRepository } from './repositories/IHealthRepository';
import { createAuthRouter } from './routes/auth';
import { createHealthRouter } from './routes/health';
import { AuthService } from './services/AuthService';

export type AppDependencies = {
  healthRepository: IHealthRepository;
  authService: AuthService;
};

export function createApp({
  healthRepository,
  authService,
}: AppDependencies): Express {
  const app = express();

  app.use(express.json());

  app.use('/health', createHealthRouter(healthRepository));
  app.use('/auth', createAuthRouter(authService));

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
