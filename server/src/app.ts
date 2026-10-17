import cors from 'cors';
import express, { Express, NextFunction, Request, Response } from 'express';
import { IHealthRepository } from './repositories/IHealthRepository';
import { IStudyRepository } from './repositories/IStudyRepository';
import { createAccountRouter } from './routes/account';
import { createAuthRouter } from './routes/auth';
import { createHealthRouter } from './routes/health';
import { createStudyRouter } from './routes/study';
import { AuthService } from './services/AuthService';

export type AppDependencies = {
  healthRepository: IHealthRepository;
  authService: AuthService;
  studyRepository: IStudyRepository;
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  };
}

export function createApp({
  healthRepository,
  authService,
  studyRepository,
}: AppDependencies): Express {
  const app = express();

  app.use(cors(getCorsOptions()));
  // Matches the plan size limit validated in the study route.
  app.use(express.json({ limit: '512kb' }));

  app.use('/health', createHealthRouter(healthRepository));
  app.use('/auth', createAuthRouter(authService));
  app.use('/account', createAccountRouter(authService));
  app.use('/study', createStudyRouter(studyRepository));

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const status = errorStatus(err);

    if (status >= 500) {
      console.error(err);
    }

    res.status(status).json({ error: errorMessage(status) });
  });

  return app;
}

/**
 * `express.json` rejects malformed or oversized bodies with an error that
 * carries an HTTP status (400 / 413). Reporting those as 500 would blame the
 * server for a bad request, so the status is passed through when present.
 */
function errorStatus(err: Error): number {
  const candidate = (err as { status?: unknown; statusCode?: unknown }).status ??
    (err as { statusCode?: unknown }).statusCode;

  return typeof candidate === 'number' &&
    Number.isInteger(candidate) &&
    candidate >= 400 &&
    candidate <= 599
    ? candidate
    : 500;
}

function errorMessage(status: number): string {
  if (status < 500) {
    return status === 413 ? 'Payload too large' : 'Invalid request';
  }

  return 'Internal Server Error';
}
