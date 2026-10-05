import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { assertAuthConfig } from './auth/token';
import { authService, healthRepository } from './container';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main(): Promise<void> {
  // Fail fast on a missing or weak JWT secret
  assertAuthConfig();

  // Verify database connectivity before accepting traffic
  await healthRepository.ping();

  const app = createApp({ healthRepository, authService });

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
