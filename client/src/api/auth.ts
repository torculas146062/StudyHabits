import { ApiError, apiPost } from './client';

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
