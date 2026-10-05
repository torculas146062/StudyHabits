import dotenv from 'dotenv';
dotenv.config();

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import mysql from 'mysql2/promise';

/**
 * Applies `db/seed.sql` to the database server.
 *
 * Connects without selecting a database so the script can create it, and runs
 * the whole file as one multi-statement query. Safe to run repeatedly.
 */
async function main(): Promise<void> {
  const sql = await readFile(
    path.join(__dirname, '../../db/seed.sql'),
    'utf8'
  );

  const host = process.env.DB_HOST ?? 'localhost';
  const port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;

  const connection = await mysql.createConnection({
    host,
    port,
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    console.log(`Applied db/seed.sql to ${host}:${port}`);
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error('Failed to seed the database:', err);
  process.exit(1);
});
