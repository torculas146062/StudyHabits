import { pool } from './config/db';
import { IHealthRepository } from './repositories/IHealthRepository';
import { MySqlHealthRepository } from './repositories/mysql/MySqlHealthRepository';

/**
 * Composition root — the only module that knows which database
 * implementation is used.
 *
 * To switch databases, build another implementation of the repository
 * interfaces (e.g. `repositories/postgres/...`) and wire it up here.
 */
export const healthRepository: IHealthRepository = new MySqlHealthRepository(
  pool
);
