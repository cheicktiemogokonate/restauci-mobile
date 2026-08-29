import { API_URL, ENDPOINTS } from "@/constants/api";
import { parseApiSuccess, refreshDataSchema } from "@/lib/apiValidation";
import { useStore } from "@/store";
import type { ApiError, ApiErrorCode } from "@/types";
import * as SecureStore from "expo-secure-store";
import {
  AUTH_ACCESS_TOKEN_KEY,
  AUTH_REFRESH_TOKEN_KEY,
  storeNativeTokens,
} from "@/lib/authSessionStorage";

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

function requestSignal(
  callerSignal: AbortSignal | null | undefined,
  timeoutMs: number,
): { signal: AbortSignal; clear: () => void } {
  const timeout = withTimeout(timeoutMs);
  if (!callerSignal) return timeout;

  const combineSignals = AbortSignal.any;
  if (typeof combineSignals === "function") {
    return {
      signal: combineSignals([callerSignal, timeout.signal]),
      clear: timeout.clear,
    };
  }

  // Compatibilité avec les runtimes RN sans AbortSignal.any : ne jamais
  // perdre l'annulation fournie par TanStack Query au profit du timeout.
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (callerSignal.aborted || timeout.signal.aborted) {
    abort();
  } else {
    callerSignal.addEventListener("abort", abort, { once: true });
    timeout.signal.addEventListener("abort", abort, { once: true });
  }

  return {
    signal: controller.signal,
    clear: () => {
      callerSignal.removeEventListener("abort", abort);
      timeout.signal.removeEventListener("abort", abort);
      timeout.clear();
    },
  };
}

async function readResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204) return undefined;

  const text = await response.text();
  if (!text) return undefined;

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function retryAfterSeconds(response: Response, body: unknown): number | null {
  if (body && typeof body === "object") {
    const value = (body as { retryAfter?: unknown }).retryAfter;
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return value;
    }
  }

  const header = response.headers.get("Retry-After");
  if (!header) return null;

  const seconds = Number(header);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds;

  const date = Date.parse(header);
  return Number.isNaN(date)
    ? null
    : Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code?: ApiErrorCode;
  readonly details?: Record<string, string[]>;
  readonly retryAfter: number | null;

  constructor({
    status,
    message,
    code,
    details,
    retryAfter,
  }: {
    status: number;
    message: string;
    code?: ApiErrorCode;
    details?: Record<string, string[]>;
    retryAfter?: number | null;
  }) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
    this.retryAfter = retryAfter ?? null;
  }
}

async function performRefresh(): Promise<string | null> {
  const sessionAtStart = useStore.getState();
  const refreshToken = await SecureStore.getItemAsync(AUTH_REFRESH_TOKEN_KEY);
  if (!refreshToken) return null;
  const { signal, clear } = withTimeout(REFRESH_TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}${ENDPOINTS.authClientRefresh}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenTransport: "json",
        refreshToken,
      }),
      signal,
    });

    if (!res.ok) return null;

    const response = parseApiSuccess<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    }>(await readResponseBody(res), refreshDataSchema, "auth/refresh");
    const newAccessToken = response.data.accessToken;

    const currentSession = useStore.getState();
    if (
      currentSession.client?.id !== sessionAtStart.client?.id ||
      currentSession.token !== sessionAtStart.token
    ) {
      return currentSession.client && currentSession.token
        ? currentSession.token
        : null;
    }

    await storeNativeTokens({
      accessToken: newAccessToken,
      refreshToken: response.data.refreshToken,
    });
    useStore.setState({ token: newAccessToken });

    return newAccessToken;
  } catch {
    return null;
  } finally {
    clear();
  }
}

let refreshInFlight: Promise<string | null> | null = null;

/** Mutualise la rotation du cookie et du token entre toutes les requêtes 401. */
function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

function buildHeaders(
  headersInit: HeadersInit | undefined,
  token: string | null,
  hasBody: boolean,
  skipAuth: boolean,
): Headers {
  const headers = new Headers(headersInit);
  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (skipAuth) {
    headers.delete("Authorization");
  } else if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function executeRequest(
  endpoint: string,
  requestOptions: RequestInit,
  token: string | null,
  skipAuth: boolean,
): Promise<{ response: Response; body: unknown }> {
  const { signal, clear } = requestSignal(
    requestOptions.signal,
    DEFAULT_TIMEOUT_MS,
  );
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...requestOptions,
      credentials: requestOptions.credentials ?? "include",
      headers: buildHeaders(
        requestOptions.headers,
        token,
        requestOptions.body != null,
        skipAuth,
      ),
      signal,
    });
    const body = await readResponseBody(response);
    return { response, body };
  } finally {
    clear();
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit & { skipAuth?: boolean },
): Promise<T> {
  const { skipAuth = false, ...requestOptions } = options ?? {};
  let token = useStore.getState().token;

  if (!token && !skipAuth) {
    if (__DEV__) {
      console.warn('[apiFetch] token absent dans le store pour', endpoint);
    }
    const stored = await SecureStore.getItemAsync(AUTH_ACCESS_TOKEN_KEY);
    if (stored) {
      token = stored;
      useStore.setState({ token: stored });
    }
  }

  const tokenUsed = token;
  let result = await executeRequest(endpoint, requestOptions, token, skipAuth);

  if (result.response.status === 401 && !skipAuth) {
    if (__DEV__) {
      console.warn('[apiFetch] 401 — tentative de refresh');
    }
    const currentToken = useStore.getState().token;
    const newToken =
      currentToken && currentToken !== tokenUsed
        ? currentToken
        : await refreshAccessToken();
    if (newToken) {
      result = await executeRequest(endpoint, requestOptions, newToken, false);
    } else {
      if (__DEV__) {
        console.warn('[apiFetch] refresh échoué — déconnexion');
      }
      await useStore.getState().logout({ revokeRemote: false });
    }
  }

  const { response: res, body } = result;

  if (!res.ok) {
    const err =
      body && typeof body === "object" ? (body as Partial<ApiError>) : null;
    const message =
      typeof err?.error === "string"
        ? err.error
        : typeof body === "string"
          ? body
          : `Erreur ${res.status}`;
    const retryAfter = retryAfterSeconds(res, body);
    if (__DEV__) {
      const log = res.status >= 500 ? console.error : console.warn;
      log(`[apiFetch] ${res.status} ${endpoint}`, body);
    }
    throw new ApiClientError({
      status: res.status,
      message,
      code: err?.code,
      details: err?.details,
      retryAfter,
    });
  }

  return body as T;
}
