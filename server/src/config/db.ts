import mysql, { Pool } from 'mysql2/promise';

export const pool: Pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'studyhabits',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
});
