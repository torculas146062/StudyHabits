import Constants from 'expo-constants';

const DEFAULT_API_PORT = 3000;

export class ApiError extends Error {
  readonly status?: number;
  readonly fields: Record<string, string>;

  constructor(
    message: string,
    status?: number,
    fields: Record<string, string> = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

/**
 * Base URL of the backend.
 *
 * On a phone `localhost` points at the phone itself, so the host is taken from
 * the Expo dev server instead — that's the machine running `npm run dev`, which
 * is already reachable over the LAN from Expo Go and installed builds.
 *
 * Set `EXPO_PUBLIC_API_URL` to override this, e.g. for a deployed server.
 */
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  const host = Constants.expoConfig?.hostUri?.split(':')[0];

  return `http://${host ?? 'localhost'}:${DEFAULT_API_PORT}`;
}

export async function apiPost(path: string, body: unknown): Promise<Response> {
  return apiRequest(path, { method: 'POST', body });
}

type ApiRequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Bearer token for routes that act on the signed-in user's data. */
  token?: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * Sends a request and treats a network failure or timeout as an `ApiError`, so
 * callers can tell "offline" apart from an HTTP error response.
 */
export async function apiRequest(
  path: string,
  { method, body, token, timeoutMs = DEFAULT_TIMEOUT_MS }: ApiRequestOptions
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(`${getApiBaseUrl()}${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      `Could not reach the server at ${getApiBaseUrl()}. Make sure it is running and that you are on the same network.`
    );
  } finally {
    clearTimeout(timeout);
  }
}
