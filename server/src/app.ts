import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import { IHealthRepository } from './repositories/IHealthRepository';
import { createAuthRouter } from './routes/auth';
import { createHealthRouter } from './routes/health';
import { AuthService } from './services/AuthService';

export type AppDependencies = {
  healthRepository: IHealthRepository;
  authService: AuthService;
};

/**
 * Cross-origin access is only needed by browser clients (the web build); native
 * apps send no Origin header and are unaffected.
 *
 * By default any origin is reflected so local development works out of the box.
 * Set `CORS_ORIGINS` to a comma-separated list to restrict it: no credentials
 * are sent as cookies, but a lock-down is still worthwhile for a deployment.
 */
function getCorsOptions() {
  const allowedOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

export function createApp({
  healthRepository,
  authService,
}: AppDependencies): Express {
  const app = express();

  app.use(cors(getCorsOptions()));
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
