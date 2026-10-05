import { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { EmailAlreadyInUseError } from '../../errors';
import { IUserRepository, NewUser, User } from '../IUserRepository';

type UserRow = RowDataPacket & {
  id: number;
  name: string;
  email: string;
  password_hash: string;
};

const DUPLICATE_ENTRY_CODE = 'ER_DUP_ENTRY';

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
  };
}

function isDuplicateEntry(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === DUPLICATE_ENTRY_CODE
  );
}

/**
 * MySQL adapter for {@link IUserRepository}.
 *
 * Every statement is parameterised, so user input is never interpolated into SQL.
 */
export class MySqlUserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async create(user: NewUser): Promise<User> {
    try {
      const [result] = await this.pool.execute<ResultSetHeader>(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [user.name, user.email, user.passwordHash]
      );

      return { id: result.insertId, ...user };
    } catch (err) {
      // Rely on the unique index rather than a check-then-insert, which would
      // race between concurrent sign-ups.
      if (isDuplicateEntry(err)) {
        throw new EmailAlreadyInUseError();
      }

      throw err;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const [rows] = await this.pool.execute<UserRow[]>(
      'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    return rows.length > 0 ? toUser(rows[0]) : null;
  }
}
