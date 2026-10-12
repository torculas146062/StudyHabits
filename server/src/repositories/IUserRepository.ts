export type User = {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
};

export type NewUser = {
  name: string;
  email: string;
  passwordHash: string;
};

/**
 * Port for user persistence.
 *
 * Callers depend only on this interface. Technology-specific implementations
 * live in subfolders (e.g. `repositories/mysql`) so the underlying database
 * can be swapped without changing callers.
 */
export interface IUserRepository {
  /**
   * Persists a new user.
   *
   * Rejects with an `EmailAlreadyInUseError` when the email is already taken.
   */
  create(user: NewUser): Promise<User>;

  findByEmail(email: string): Promise<User | null>;

  /** Removes a user and, through foreign keys, their stored data. */
  deleteById(id: number): Promise<boolean>;
}
