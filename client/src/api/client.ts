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
  try {
    return await fetch(`${getApiBaseUrl()}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiError(
      `Could not reach the server at ${getApiBaseUrl()}. Make sure it is running and that you are on the same network.`
    );
  }
}
