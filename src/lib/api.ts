import { API_URL, ENDPOINTS } from '@/constants/api';
import { useStore } from '@/store';
import * as SecureStore from 'expo-secure-store';

const AUTH_ACCESS_TOKEN_KEY = 'auth_access_token';
const AUTH_REFRESH_TOKEN_KEY = 'auth_refresh_token';

/** Tente de rafraîchir le token si le refreshToken existe en SecureStore */
async function tryRefreshToken(): Promise<string | null> {
  try {
    const refreshToken = await SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    const res = await fetch(`${API_URL}${ENDPOINTS.authClientRefresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      data?: { tokens?: { accessToken?: string; refreshToken?: string } };
    };

    const newAccessToken = data?.data?.tokens?.accessToken;
    const newRefreshToken = data?.data?.tokens?.refreshToken;

    if (!newAccessToken) return null;

    // Met à jour SecureStore et le store Zustand
    await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, newAccessToken);
    if (newRefreshToken) {
      await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, newRefreshToken);
    }
    useStore.setState({ token: newAccessToken });

    return newAccessToken;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  let token = useStore.getState().token;

  // Debug : log si le token est absent
  if (!token) {
    console.warn('[apiFetch] ⚠️ token absent dans le store pour', endpoint);
    // Tentative de récupération depuis SecureStore directement
    const stored = await SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY);
    if (stored) {
      console.log('[apiFetch] token récupéré depuis SecureStore');
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

  let res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: buildHeaders(token),
  });

  // Si 401, on tente un refresh automatique et on relance une fois
  if (res.status === 401) {
    console.warn('[apiFetch] 401 reçu, tentative de refresh du token...');
    const newToken = await tryRefreshToken();
    if (newToken) {
      console.log('[apiFetch] token rafraîchi, nouvelle tentative...');
      res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: buildHeaders(newToken),
      });
    } else {
      // Refresh impossible → déconnexion propre
      console.error('[apiFetch] refresh échoué → déconnexion');
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
    console.error(`[apiFetch] Erreur ${res.status} sur ${endpoint}:`, err);
    throw new Error(err.error ?? `Erreur ${res.status}`);
  }

  return res.json() as T;
}
