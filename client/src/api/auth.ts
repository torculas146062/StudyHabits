import { ApiError, apiPost, apiRequest } from './client';

export type AuthUser = {
  id: number;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

type AuthErrorBody = {
  error?: string;
  fields?: Record<string, string>;
};

export function signIn(email: string, password: string): Promise<AuthResponse> {
  return postAuth('/auth/login', { email, password });
}

export function signUp(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return postAuth('/auth/register', { name, email, password });
}

/**
 * Permanently deletes the signed-in account and its synced plan on the server.
 * A 404 means it was already deleted elsewhere, which callers can treat as done.
 */
export async function deleteAccount(token: string): Promise<void> {
  const response = await apiRequest('/account', {
    method: 'DELETE',
    token,
  });

  if (response.ok || response.status === 404) {
    return;
  }

  throw new ApiError('Could not delete the account.', response.status);
}

async function postAuth(
  path: string,
  body: Record<string, string>
): Promise<AuthResponse> {
  const response = await apiPost(path, body);
  const payload = (await readJson(response)) as AuthResponse & AuthErrorBody;

  if (!response.ok) {
    throw new ApiError(
      payload.error ?? 'Something went wrong. Please try again.',
      response.status,
      payload.fields ?? {}
    );
  }

  return payload;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}
