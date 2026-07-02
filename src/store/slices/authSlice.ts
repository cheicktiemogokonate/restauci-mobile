import type { StateCreator } from "zustand";
import * as SecureStore from "expo-secure-store";
import { API_URL, ENDPOINTS } from "@/constants/api";
import type { ClientSession } from "@/types";

const AUTH_TOKEN_KEY = "auth_token";

export interface AuthSlice {
  client: ClientSession | null;
  token: string | null;
  isLoading: boolean;
  setClient: (client: ClientSession, token: string) => void;
  logout: () => void;
  loadToken: () => Promise<void>;
}

export const createAuthSlice: StateCreator<AuthSlice> = (set) => ({
  client: null,
  token: null,
  isLoading: true,

  setClient(client, token) {
    SecureStore.setItemAsync(AUTH_TOKEN_KEY, token).catch(() => {});
    set({ client, token, isLoading: false });
  },

  logout() {
    SecureStore.deleteItemAsync(AUTH_TOKEN_KEY).catch(() => {});
    set({ client: null, token: null, isLoading: false });
  },

  async loadToken() {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      if (!token) {
        set({ isLoading: false });
        return;
      }

      // Note : on ne réutilise pas `apiFetch` ici pour éviter une dépendance
      // circulaire store -> lib/api -> store, et parce que ce token n'est pas
      // encore dans le state au moment de l'appel.
      const res = await fetch(`${API_URL}${ENDPOINTS.authClientMe}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
        set({ isLoading: false });
        return;
      }

      const client = (await res.json()) as ClientSession;
      set({ client, token, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
});
