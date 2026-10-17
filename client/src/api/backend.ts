import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import * as Network from 'expo-network';
import { Platform } from 'react-native';

import { API_PORT, devServerApiUrl } from './client';

const STORAGE_KEY = 'studyhabits.backendUrl';

/** A LAN probe must fail fast: a slow reply is not the server we are after. */
const PROBE_TIMEOUT_MS = 600;
/** The saved address deserves a little more patience than a blind sweep. */
const SAVED_TIMEOUT_MS = 2500;
/** Hosts probed at once; keeps the whole sweep to a few seconds. */
const SCAN_CONCURRENCY = 32;
const LAST_HOST = 254;

export type BackendResolution =
  | { status: 'ready'; url: string }
  | { status: 'needs-url' };

type HealthPayload = {
  status?: unknown;
  database?: unknown;
};

/** Expo Go and the browser already know where the dev machine is. */
export function usesDevServerUrl(): boolean {
  return Platform.OS === 'web' || isRunningInExpoGo();
}

/** `192.168.1.42` → `http://192.168.1.42:3000`; accepts a bare host too. */
export function normalizeBackendUrl(input: string): string {
  const trimmed = input.trim().replace(/\/+$/, '');

  if (!trimmed) {
    return '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

/**
 * The part of a private IPv4 address shared by its neighbours, or null when the
 * address is not on a private network (there is nothing sensible to scan then).
 */
export function lanPrefix(address: string): string | null {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(address.trim());

  if (!match) {
    return null;
  }

  const [first, second] = [Number(match[1]), Number(match[2])];
  const isPrivate =
    first === 10 ||
    (first === 192 && second === 168) ||
    (first === 172 && second >= 16 && second <= 31);

  return isPrivate ? `${match[1]}.${match[2]}.${match[3]}.` : null;
}

/**
 * Asked of every candidate: is a Study Habits API listening here? The health
 * route answers with `{ status, database }`, which is distinctive enough to
 * tell our server apart from whatever else happens to hold port 3000.
 */
export async function isBackendAt(
  url: string,
  timeoutMs: number = PROBE_TIMEOUT_MS
): Promise<boolean> {
  const base = normalizeBackendUrl(url);

  if (!base) {
    return false;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${base}/health`, {
      signal: controller.signal,
    });

    // 503 still identifies our API — it just means its database is down.
    if (!response.ok && response.status !== 503) {
      return false;
    }

    const payload = (await response.json()) as HealthPayload;

    return (
      typeof payload.status === 'string' && typeof payload.database === 'string'
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Sweeps the phone's own subnet for a server on `API_PORT`, in parallel batches
 * and in address order, so the sweep finishes in a couple of seconds and stops
 * as soon as something answers.
 */
export async function discoverBackendOnLan(): Promise<string | null> {
  const state = await Network.getNetworkStateAsync().catch(() => null);

  if (!state?.isConnected) {
    return null;
  }

  const address = await Network.getIpAddressAsync().catch(() => '');
  const prefix = address ? lanPrefix(address) : null;

  if (!prefix) {
    return null;
  }

  const hosts = Array.from({ length: LAST_HOST }, (_, index) => index + 1)
    .map((host) => `${prefix}${host}`)
    .filter((host) => host !== address.trim());

  for (let index = 0; index < hosts.length; index += SCAN_CONCURRENCY) {
    const batch = hosts.slice(index, index + SCAN_CONCURRENCY);
    const answers = await Promise.all(
      batch.map(async (host) => {
        const url = `http://${host}:${API_PORT}`;

        return (await isBackendAt(url)) ? url : null;
      })
    );

    const found = answers.find((url): url is string => url !== null);

    if (found) {
      return found;
    }
  }

  return null;
}

export async function loadSavedBackendUrl(): Promise<string | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);

    return stored ? normalizeBackendUrl(stored) : null;
  } catch {
    return null;
  }
}

export async function saveBackendUrl(url: string): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, normalizeBackendUrl(url));
  } catch {
    // Best effort: the app still works for this session.
  }
}

/**
 * Decides where the app should talk to.
 *
 * - Expo Go and web keep using the Expo dev server's host.
 * - An installed build reuses the address it was given last time when it still
 *   answers, then sweeps the LAN, and only then asks the user for one.
 */
export async function resolveBackend(): Promise<BackendResolution> {
  if (usesDevServerUrl()) {
    return { status: 'ready', url: devServerApiUrl() };
  }

  const saved = await loadSavedBackendUrl();

  if (saved && (await isBackendAt(saved, SAVED_TIMEOUT_MS))) {
    return { status: 'ready', url: saved };
  }

  const discovered = await discoverBackendOnLan();

  if (discovered) {
    await saveBackendUrl(discovered);

    return { status: 'ready', url: discovered };
  }

  return { status: 'needs-url' };
}
