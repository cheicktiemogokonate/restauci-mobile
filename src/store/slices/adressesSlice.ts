import {
  GUEST_LOCAL_DATA_OWNER,
  readAddresses,
  writeAddresses,
} from "@/lib/localDataStorage";
import {
  MAX_ADRESSES_LOCALES,
  normaliserAdresses,
} from "@/lib/adresses";
import type { AdresseLocale } from "@/types";
import type { StateCreator } from "zustand";

import type { UnifiedStore } from "..";

export interface AdressesSlice {
  adresses: AdresseLocale[];
  isLoadingAdresses: boolean;
  loadAdresses: () => Promise<void>;
  ajouterAdresse: (
    adresse: Omit<AdresseLocale, "id"> & { id?: string },
  ) => Promise<void>;
  supprimerAdresse: (id: string) => Promise<void>;
  mettreAJourAdresse: (
    id: string,
    adresse: Partial<AdresseLocale>,
  ) => Promise<void>;
}

export const createAdressesSlice: StateCreator<
  UnifiedStore,
  [],
  [],
  AdressesSlice
> = (set, get) => ({
  adresses: [],
  isLoadingAdresses: true,

  async loadAdresses() {
    const ownerId = get().localDataOwner;
    if (!ownerId) return;

    set({ isLoadingAdresses: true });

    try {
      const adresses = await readAddresses(ownerId);
      if (get().localDataOwner !== ownerId) return;

      set({
        adresses,
        isLoadingAdresses: false,
      });
    } catch {
      if (get().localDataOwner !== ownerId) return;
      set({ adresses: [], isLoadingAdresses: false });
    }
  },

  async ajouterAdresse(adresse) {
    const ownerId =
      get().localDataOwner ?? GUEST_LOCAL_DATA_OWNER;
    const current = get().adresses;
    if (current.length >= MAX_ADRESSES_LOCALES) {
      throw new Error(
        `Vous pouvez enregistrer jusqu’à ${MAX_ADRESSES_LOCALES} adresses.`,
      );
    }

    const nouvelleAdresse: AdresseLocale = {
      ...adresse,
      id:
        adresse.id ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    };
    const next = normaliserAdresses(
      [nouvelleAdresse, ...current],
      current.length === 0 || adresse.estParDefaut
        ? nouvelleAdresse.id
        : undefined,
    );

    await writeAddresses(ownerId, next);
    if (get().localDataOwner === ownerId) {
      set({ adresses: next });
    }
  },

  async supprimerAdresse(id) {
    const ownerId =
      get().localDataOwner ?? GUEST_LOCAL_DATA_OWNER;
    const next = normaliserAdresses(
      get().adresses.filter((adresse) => adresse.id !== id),
    );

    await writeAddresses(ownerId, next);
    if (get().localDataOwner === ownerId) {
      set({ adresses: next });
    }
  },

  async mettreAJourAdresse(id, updates) {
    const ownerId =
      get().localDataOwner ?? GUEST_LOCAL_DATA_OWNER;
    const current = get().adresses;
    const adresseActuelle = current.find((adresse) => adresse.id === id);
    const prochaineAdresseParDefaut =
      updates.estParDefaut === true
        ? id
        : updates.estParDefaut === false &&
            adresseActuelle?.estParDefaut
          ? current.find((adresse) => adresse.id !== id)?.id
          : undefined;
    const next = normaliserAdresses(
      current.map((adresse) =>
      adresse.id === id ? { ...adresse, ...updates } : adresse,
      ),
      prochaineAdresseParDefaut,
    );

    await writeAddresses(ownerId, next);
    if (get().localDataOwner === ownerId) {
      set({ adresses: next });
    }
  },
});
