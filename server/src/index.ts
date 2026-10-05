import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { healthRepository } from './container';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

async function main(): Promise<void> {
  // Verify database connectivity before accepting traffic
  await healthRepository.ping();

  const app = createApp(healthRepository);

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
