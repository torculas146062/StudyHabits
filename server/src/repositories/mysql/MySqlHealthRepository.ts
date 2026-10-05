import { Pool } from 'mysql2/promise';

import { IHealthRepository } from '../IHealthRepository';

/**
 * MySQL adapter for {@link IHealthRepository}.
 *
 * This is the only place that knows the MySQL-specific statement used to
 * probe connectivity.
 */
export class MySqlHealthRepository implements IHealthRepository {
  constructor(private readonly pool: Pool) {}

  async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }
}
