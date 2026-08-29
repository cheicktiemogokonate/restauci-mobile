import { API_URL, ENDPOINTS } from "@/constants/api";
import {
  clientSessionSchema,
  refreshDataSchema,
} from "@/lib/apiValidation";
import { GUEST_LOCAL_DATA_OWNER } from "@/lib/localDataStorage";
import type { ClientSession } from "@/types";
import * as SecureStore from "expo-secure-store";
import type { StateCreator } from "zustand";
import {
  AUTH_CLIENT_KEY,
  clearNativeSessionStorage,
  readNativeTokens,
  storeNativeTokens,
} from "@/lib/authSessionStorage";
import {
  clearStoredExpoPushToken,
  readStoredExpoPushToken,
} from "@/lib/pushTokenStorage";

import type { UnifiedStore } from "..";

/**
 * Timeout global pour la séquence loadToken (ms).
 * Au-delà, l'app bascule en session anonyme plutôt que de bloquer
 * l'utilisateur sur un splash écran indéfini.
 */
const LOAD_TOKEN_TIMEOUT_MS = 5_000;
const LOGOUT_TIMEOUT_MS = 5_000;

let authOperationVersion = 0;

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
    refreshToken: string,
  ) => Promise<void>;
  logout: (options?: { revokeRemote?: boolean }) => Promise<void>;
  loadToken: () => Promise<void>;
}

const parseClient = (payload: unknown): ClientSession | null => {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  const data =
    (candidate.data as Record<string, unknown> | undefined) ?? candidate;
  const clientCandidate =
    (data.client as Record<string, unknown> | undefined) ?? data;

  const result = clientSessionSchema.safeParse(clientCandidate);
  return result.success ? result.data : null;
};

async function deleteStoredTokens(): Promise<void> {
  await clearNativeSessionStorage();
}

async function storeClientSnapshot(client: ClientSession): Promise<void> {
  await SecureStore.setItemAsync(AUTH_CLIENT_KEY, JSON.stringify(client));
}

function parseStoredClient(value: string | null): ClientSession | null {
  if (!value) return null;
  try {
    return parseClient(JSON.parse(value) as unknown);
  } catch {
    return null;
  }
}

async function revokeRemoteSession(
  accessToken: string | null,
  refreshToken: string | null,
): Promise<void> {
  const expoToken = await readStoredExpoPushToken();
  if (accessToken && expoToken) {
    await withTimeout(
      (signal) => fetch(`${API_URL}${ENDPOINTS.clientPushExpo}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ expoToken }),
        signal,
      }),
      LOGOUT_TIMEOUT_MS,
    );
  }
  await withTimeout(
    (signal) => fetch(`${API_URL}${ENDPOINTS.authClientLogout}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        tokenTransport: "json",
        ...(refreshToken ? { refreshToken } : {}),
      }),
      signal,
    }),
    LOGOUT_TIMEOUT_MS,
  );
}

const parseTokens = (payload: unknown) => {
  if (!payload || typeof payload !== "object") return null;

  const candidate = payload as Record<string, unknown>;
  const data =
    (candidate.data as Record<string, unknown> | undefined) ?? candidate;
  const tokens = (data.tokens as Record<string, unknown> | undefined) ?? data;

  const result = refreshDataSchema.safeParse(tokens);
  return result.success ? result.data : null;
};

interface RestoredSession {
  client: ClientSession | null;
  token: string | null;
}

async function clearInvalidSession(
  operationVersion: number,
): Promise<RestoredSession> {
  if (operationVersion === authOperationVersion) {
    await deleteStoredTokens();
    await clearStoredExpoPushToken().catch(() => {});
  }
  return { client: null, token: null };
}

async function restoreRemoteSession({
  accessToken,
  refreshToken,
  signal,
  operationVersion,
  onTokenRotated,
}: {
  accessToken: string | null;
  refreshToken: string;
  signal: AbortSignal;
  operationVersion: number;
  onTokenRotated: (token: string) => void;
}): Promise<RestoredSession | null> {
  const meResponse = accessToken
    ? await fetch(`${API_URL}${ENDPOINTS.authClientMe}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal,
      })
    : null;

  if (meResponse?.ok) {
    const client = parseClient(await meResponse.json());
    if (!client) {
      throw new Error("Profil client invalide");
    }
    if (operationVersion === authOperationVersion) {
      await storeClientSnapshot(client);
    }
    return { client, token: accessToken };
  }

  if (meResponse?.status === 403) {
    return clearInvalidSession(operationVersion);
  }
  if (meResponse && meResponse.status !== 401) {
    throw new Error(`Session temporairement indisponible (${meResponse.status})`);
  }

  const refreshResponse = await fetch(
    `${API_URL}${ENDPOINTS.authClientRefresh}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenTransport: "json",
        refreshToken,
      }),
      signal,
    },
  );

  if (!refreshResponse.ok) {
    if (refreshResponse.status === 401 || refreshResponse.status === 403) {
      return clearInvalidSession(operationVersion);
    }
    throw new Error(
      `Renouvellement temporairement indisponible (${refreshResponse.status})`,
    );
  }

  const refreshedTokens = parseTokens(await refreshResponse.json());
  if (!refreshedTokens) {
    return clearInvalidSession(operationVersion);
  }

  if (operationVersion !== authOperationVersion) return null;
  onTokenRotated(refreshedTokens.accessToken);
  await storeNativeTokens({
    accessToken: refreshedTokens.accessToken,
    refreshToken: refreshedTokens.refreshToken,
  });

  const recheckResponse = await fetch(
    `${API_URL}${ENDPOINTS.authClientMe}`,
    {
      headers: { Authorization: `Bearer ${refreshedTokens.accessToken}` },
      signal,
    },
  );

  if (!recheckResponse.ok) {
    if (recheckResponse.status === 401 || recheckResponse.status === 403) {
      return clearInvalidSession(operationVersion);
    }
    throw new Error(
      `Profil temporairement indisponible (${recheckResponse.status})`,
    );
  }

  const client = parseClient(await recheckResponse.json());
  if (!client) {
    throw new Error("Profil client invalide après renouvellement");
  }
  if (operationVersion === authOperationVersion) {
    await storeClientSnapshot(client);
  }
  return { client, token: refreshedTokens.accessToken };
}

export const createAuthSlice: StateCreator<
  UnifiedStore,
  [],
  [],
  AuthSlice
> = (set, get) => ({
  client: null,
  token: null,
  isLoading: true,

  async setClient(client, accessToken, refreshToken) {
    const operationVersion = ++authOperationVersion;
    await Promise.all([
      storeNativeTokens({ accessToken, refreshToken }),
      storeClientSnapshot(client),
    ]);

    if (operationVersion !== authOperationVersion) return;

    set({ client, token: accessToken, isLoading: false });
    await get().activateLocalDataOwner(client.id, {
      transferGuestCart: true,
    });
  },

  async logout({ revokeRemote = true } = {}) {
    const operationVersion = ++authOperationVersion;
    const accessToken = get().token;
    const { refreshToken } = await readNativeTokens();

    if (revokeRemote) {
      try {
        await revokeRemoteSession(accessToken, refreshToken);
      } catch {
        // Le nettoyage local reste obligatoire même si le réseau est indisponible.
      }
    }

    // Une reconnexion plus récente ne doit jamais être effacée par cet ancien logout.
    if (operationVersion !== authOperationVersion) return;

    await deleteStoredTokens();
    if (operationVersion !== authOperationVersion) return;

    set({ client: null, token: null, isLoading: false });
    await get().activateLocalDataOwner(GUEST_LOCAL_DATA_OWNER);
  },

  async loadToken() {
    const operationVersion = ++authOperationVersion;
    const storedSession = await withTimeout(async () => {
      const [{ accessToken, refreshToken }, clientValue] = await Promise.all([
        readNativeTokens(),
        SecureStore.getItemAsync(AUTH_CLIENT_KEY),
      ]);
      return {
        accessToken,
        refreshToken,
        cachedClient: parseStoredClient(clientValue),
      };
    }, LOAD_TOKEN_TIMEOUT_MS);

    if (operationVersion !== authOperationVersion) return;

    const accessToken = storedSession?.accessToken ?? null;
    const refreshToken = storedSession?.refreshToken ?? null;
    const cachedClient = storedSession?.cachedClient ?? null;
    let usableAccessToken = accessToken;
    const result = refreshToken
      ? await withTimeout(
          (signal) =>
            restoreRemoteSession({
              accessToken,
              refreshToken,
              signal,
              operationVersion,
              onTokenRotated: (token) => {
                usableAccessToken = token;
              },
            }),
          LOAD_TOKEN_TIMEOUT_MS,
        )
      : { client: null, token: null };

    if (operationVersion !== authOperationVersion) return;

    // Hors ligne ou backend temporairement indisponible : conserver la
    // session locale connue. Les requêtes réseau restent gérées séparément.
    const recoveredSession =
      result ??
      (usableAccessToken && cachedClient
        ? { client: cachedClient, token: usableAccessToken }
        : { client: null, token: usableAccessToken });
    const client = recoveredSession.client;
    set({
      client,
      token: recoveredSession.token,
    });

    await get().activateLocalDataOwner(
      client?.id ?? GUEST_LOCAL_DATA_OWNER,
    );

    if (operationVersion !== authOperationVersion) return;

    // Timeout dépassé ou erreur → session anonyme, sans bloquer
    // indéfiniment l'utilisateur sur le splash.
    set({ isLoading: false });
  },
});
