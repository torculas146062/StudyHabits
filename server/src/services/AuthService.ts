import bcrypt from 'bcryptjs';

import { signAuthToken } from '../auth/token';
import { IUserRepository, User } from '../repositories/IUserRepository';

/** Work factor of 10 keeps sign-up/login around ~100ms while staying costly to crack. */
const BCRYPT_ROUNDS = 10;

/**
 * A valid hash compared against when the email is unknown, so a failed login
 * always costs one bcrypt comparison. This keeps response times from revealing
 * whether an account exists.
 */
const ABSENT_USER_HASH =
  '$2b$10$e4pcffVqJBB2qunJ6qFp5uCu22KmLkafgIINrtb6FEd0/nMDJ9GZO';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type AuthResult = {
  token: string;
  user: AuthUser;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export class AuthService {
  constructor(private readonly users: IUserRepository) {}

  async register(input: RegisterInput): Promise<AuthResult> {
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const user = await this.users.create({
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      passwordHash,
    });

    return issue(user);
  }

  /**
   * Returns `null` for both an unknown email and a wrong password, so callers
   * can't tell the two apart.
   */
  async login(input: LoginInput): Promise<AuthResult | null> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));

    const matches = await bcrypt.compare(
      input.password,
      user?.passwordHash ?? ABSENT_USER_HASH
    );

    return user && matches ? issue(user) : null;
  }

  /** Deletes the account and everything the database holds for it. */
  async deleteAccount(userId: number): Promise<boolean> {
    return this.users.deleteById(userId);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function issue(user: User): AuthResult {
  return {
    token: signAuthToken({ sub: String(user.id), email: user.email }),
    user: { id: user.id, name: user.name, email: user.email },
  };
}
