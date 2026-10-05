/** Thrown when a sign-up is attempted with an email address that already exists. */
export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('Email address is already registered');
    this.name = 'EmailAlreadyInUseError';
  }
}
