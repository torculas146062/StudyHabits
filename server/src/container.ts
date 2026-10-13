import { pool } from './config/db';
import { IHealthRepository } from './repositories/IHealthRepository';
import { IStudyRepository } from './repositories/IStudyRepository';
import { IUserRepository } from './repositories/IUserRepository';
import { MySqlHealthRepository } from './repositories/mysql/MySqlHealthRepository';
import { MySqlStudyRepository } from './repositories/mysql/MySqlStudyRepository';
import { MySqlUserRepository } from './repositories/mysql/MySqlUserRepository';
import { AuthService } from './services/AuthService';

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

export const userRepository: IUserRepository = new MySqlUserRepository(pool);

export const studyRepository: IStudyRepository = new MySqlStudyRepository(pool);

export const authService = new AuthService(userRepository);
