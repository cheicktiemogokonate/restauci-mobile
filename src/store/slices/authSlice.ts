import { API_URL, ENDPOINTS } from "@/constants/api";
import type { ClientSession } from "@/types";
import * as SecureStore from "expo-secure-store";
import type { StateCreator } from "zustand";

const AUTH_ACCESS_TOKEN_KEY = "auth_access_token";
const AUTH_REFRESH_TOKEN_KEY = "auth_refresh_token";

/**
 * Timeout global pour la séquence loadToken (ms).
 * Au-delà, l'app bascule en session anonyme plutôt que de bloquer
 * l'utilisateur sur un splash écran indéfini.
 */
const LOAD_TOKEN_TIMEOUT_MS = 5_000;

/** Exécute `fn` avec un timeout ; résout `null` si le délai est dépassé. */
async function withTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  ms: number,
): Promise<T | null> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  try {
    return await fn(controller.signal);
  } catch {
    return null;
  } finally {
    clearTimeout(id);
  }
}

export interface AuthSlice {
  client: ClientSession | null;
  token: string | null;
  isLoading: boolean;
  setClient: (
    client: ClientSession,
    accessToken: string,
    refreshToken?: string,
  ) => void;
  logout: () => void;
  loadToken: () => Promise<void>;
}

const parseClient = (payload: unknown): ClientSession | null => {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  const data =
    (candidate.data as Record<string, unknown> | undefined) ?? candidate;
  const clientCandidate =
    (data.client as Record<string, unknown> | undefined) ?? data;

  if (!clientCandidate || typeof clientCandidate !== "object") return null;

  const id = clientCandidate.id;
  const nom = clientCandidate.nom;
  const telephone = clientCandidate.telephone;

  if (
    typeof id !== "string" ||
    typeof nom !== "string" ||
    typeof telephone !== "string"
  ) {
    return null;
  }

  return {
    id,
    nom,
    telephone,
    email:
      typeof clientCandidate.email === "string" ? clientCandidate.email : null,
    actif:
      typeof clientCandidate.actif === "boolean"
        ? clientCandidate.actif
        : undefined,
  };
};

const parseTokens = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  const data =
    (candidate.data as Record<string, unknown> | undefined) ?? candidate;
  const tokens = (data.tokens as Record<string, unknown> | undefined) ?? data;

  if (
    typeof tokens.accessToken === "string" &&
    typeof tokens.refreshToken === "string"
  ) {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn:
        typeof tokens.expiresIn === "number" ? tokens.expiresIn : undefined,
    };
  }

  if (typeof tokens.accessToken === "string") {
    return {
      accessToken: tokens.accessToken,
      refreshToken:
        typeof tokens.refreshToken === "string"
          ? tokens.refreshToken
          : undefined,
      expiresIn:
        typeof tokens.expiresIn === "number" ? tokens.expiresIn : undefined,
    };
  }

  return null;
};

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  client: null,
  token: null,
  isLoading: true,

  setClient(client, accessToken, refreshToken) {
    SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, accessToken).catch(
      () => {},
    );
    if (refreshToken) {
      SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, refreshToken).catch(
        () => {},
      );
    }
    set({ client, token: accessToken, isLoading: false });
  },

  logout() {
    SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY).catch(() => {});
    SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY).catch(() => {});
    set({ client: null, token: null, isLoading: false });
  },

  async loadToken() {
    const result = await withTimeout(async (signal) => {
      const accessToken = await SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY);

      if (!accessToken) return { client: null, token: null };

      const meResponse = await fetch(`${API_URL}${ENDPOINTS.authClientMe}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      });

      if (meResponse.ok) {
        const payload = await meResponse.json();
        const client = parseClient(payload);
        return { client, token: accessToken };
      }

      if (!refreshToken) {
        await SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY);
        return { client: null, token: null };
      }

      const refreshResponse = await fetch(
        `${API_URL}${ENDPOINTS.authClientRefresh}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
          signal,
        },
      );

      if (!refreshResponse.ok) {
        await SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY);
        return { client: null, token: null };
      }

      const refreshPayload = await refreshResponse.json();
      const refreshedTokens = parseTokens(refreshPayload);

      if (!refreshedTokens?.accessToken) {
        await SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY);
        return { client: null, token: null };
      }

      await SecureStore.setItemAsync(AUTH_ACCESS_TOKEN_KEY, refreshedTokens.accessToken);
      if (refreshedTokens.refreshToken) {
        await SecureStore.setItemAsync(AUTH_REFRESH_TOKEN_KEY, refreshedTokens.refreshToken);
      }

      const recheckResponse = await fetch(
        `${API_URL}${ENDPOINTS.authClientMe}`,
        {
          headers: { Authorization: `Bearer ${refreshedTokens.accessToken}` },
          signal,
        },
      );

      if (!recheckResponse.ok) {
        await SecureStore.deleteItemAsync(AUTH_ACCESS_TOKEN_KEY);
        await SecureStore.deleteItemAsync(AUTH_REFRESH_TOKEN_KEY);
        return { client: null, token: null };
      }

      const recheckPayload = await recheckResponse.json();
      const client = parseClient(recheckPayload);
      return { client, token: refreshedTokens.accessToken };
    }, LOAD_TOKEN_TIMEOUT_MS);

    // Timeout dépassé ou erreur → session anonyme (isLoading: false)
    // pour ne pas bloquer l'app indéfiniment sur le splash.
    set({
      client: result?.client ?? null,
      token: result?.token ?? null,
      isLoading: false,
    });
  },
});
