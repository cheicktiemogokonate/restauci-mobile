import { API_URL, ENDPOINTS } from '@/constants/api';
import { useStore } from '@/store';
import * as SecureStore from 'expo-secure-store';

const AUTH_ACCESS_TOKEN_KEY = 'auth_access_token';
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';

/** Timeout par défaut pour tous les appels réseau (ms). */
const DEFAULT_TIMEOUT_MS = 10_000;
/** Timeout dédié au refresh de token (plus court : si le serveur est lent, on déconnecte). */
const REFRESH_TIMEOUT_MS = 5_000;

/**
 * Crée un AbortController avec timeout automatique.
 * Retourne le signal ET une fonction de nettoyage à appeler après la requête
 * pour éviter les fuites mémoire.
 */
function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

/** Tente de rafraîchir le token si le refreshToken existe en SecureStore. */
async function tryRefreshToken(): Promise<string | null> {
  const { signal, clear } = withTimeout(REFRESH_TIMEOUT_MS);
  try {
    const refreshToken = await SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const res = await fetch(`${API_URL}${ENDPOINTS.authClientRefresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      signal,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      data?: { tokens?: { accessToken?: string; refreshToken?: string } };
    };

    const newAccessToken = data?.data?.tokens?.accessToken;
    const newRefreshToken = data?.data?.tokens?.refreshToken;

    if (!newAccessToken) return null;

    await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, newAccessToken);
    if (newRefreshToken) {
      await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, newRefreshToken);
    }
    useStore.setState({ token: newAccessToken });

    return newAccessToken;
  } catch {
    return null;
  } finally {
    clear();
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean },
): Promise<T> {
  let token = useStore.getState().token;

  if (!token && !options?.skipAuth) {
    if (__DEV__) {
      console.warn('[apiFetch] token absent dans le store pour', endpoint);
    }
    const stored = await SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY);
    if (stored) {
      token = stored;
      useStore.setState({ token: stored });
    }
  }

  const buildHeaders = (t: string | null): Record<string, string> => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) ?? {}),
    };
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  };

  // Utilise le signal passé par TanStack Query (annulation) ou un timeout local.
  // Si TanStack Query fournit un signal, on l'utilise directement ; le timeout
  // local est quand même armé pour les appels hors Query (ex. authSlice.loadToken).
  const callerSignal = options?.signal as AbortSignal | undefined;
  const { signal: timeoutSignal, clear } = withTimeout(DEFAULT_TIMEOUT_MS);

  // Combine les deux signaux si les deux sont présents.
  const signal = callerSignal
    ? AbortSignal.any
      ? AbortSignal.any([callerSignal, timeoutSignal])
      : timeoutSignal
    : timeoutSignal;

  const fetchOptions: RequestInit = {
    ...options,
    headers: buildHeaders(token),
    signal,
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, fetchOptions);
  } finally {
    clear();
  }

  if (res.status === 401 && !options?.skipAuth) {
    if (__DEV__) {
      console.warn('[apiFetch] 401 — tentative de refresh');
    }
    const newToken = await tryRefreshToken();
    if (newToken) {
      const { signal: retrySignal, clear: clearRetry } = withTimeout(DEFAULT_TIMEOUT_MS);
      try {
        res = await fetch(`${API_URL}${endpoint}`, {
          ...fetchOptions,
          headers: buildHeaders(newToken),
          signal: retrySignal,
        });
      } finally {
        clearRetry();
      }
    } else {
      if (__DEV__) {
        console.warn('[apiFetch] refresh échoué — déconnexion');
      }
      useStore.getState().logout();
    }
  }

  if (!res.ok) {
    let err: { error?: string } = {};
    try {
      err = (await res.json()) as { error?: string };
    } catch {
      // réponse non JSON
    }
    if (__DEV__) {
      console.error(`[apiFetch] ${res.status} ${endpoint}`, err);
    }
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }

  return res.json() as T;
}
