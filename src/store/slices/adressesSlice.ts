import type { AdresseLocale } from "@/types";
import * as SecureStore from "expo-secure-store";
import type { StateCreator } from "zustand";

const ADRESSES_STORAGE_KEY = "saved_addresses_v1";

export interface AdressesSlice {
  adresses: AdresseLocale[];
  isLoadingAdresses: boolean;
  loadAdresses: () => Promise<void>;
  ajouterAdresse: (adresse: AdresseLocale) => Promise<void>;
  supprimerAdresse: (id: string) => Promise<void>;
  mettreAJourAdresse: (
    id: string,
    adresse: Partial<AdresseLocale>,
  ) => Promise<void>;
}

export const createAdressesSlice: StateCreator<AdressesSlice> = (set, get) => ({
  adresses: [],
  isLoadingAdresses: true,

  async loadAdresses() {
    try {
      const stored = await SecureStore.getItemAsync(ADRESSES_STORAGE_KEY);
      if (!stored) {
        set({ adresses: [], isLoadingAdresses: false });
        return;
      }

      const parsed = JSON.parse(stored) as AdresseLocale[];
      set({
        adresses: Array.isArray(parsed) ? parsed : [],
        isLoadingAdresses: false,
      });
    } catch {
      set({ adresses: [], isLoadingAdresses: false });
    }
  },

  async ajouterAdresse(adresse) {
    const current = get().adresses;
    const next = [
      {
        ...adresse,
        id:
          adresse.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      },
      ...current,
    ];

    set({ adresses: next });
    await SecureStore.setItemAsync(ADRESSES_STORAGE_KEY, JSON.stringify(next));
  },

  async supprimerAdresse(id) {
    const next = get().adresses.filter((adresse) => adresse.id !== id);
    set({ adresses: next });
    await SecureStore.setItemAsync(ADRESSES_STORAGE_KEY, JSON.stringify(next));
  },

  async mettreAJourAdresse(id, updates) {
    const next = get().adresses.map((adresse) =>
      adresse.id === id ? { ...adresse, ...updates } : adresse,
    );
    set({ adresses: next });
    await SecureStore.setItemAsync(ADRESSES_STORAGE_KEY, JSON.stringify(next));
  },
});
