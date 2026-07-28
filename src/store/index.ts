import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  createAdressesSlice,
  type AdressesSlice,
} from "./slices/adressesSlice";
import { createAuthSlice, type AuthSlice } from "./slices/authSlice";
import { createCarteSlice, type CarteSlice } from "./slices/carteSlice";
import { createFavorisSlice, type FavorisSlice } from "./slices/favorisSlice";
import { createPanierSlice, type PanierSlice } from "./slices/panierSlice";

export type UnifiedStore = AuthSlice &
  PanierSlice &
  CarteSlice &
  FavorisSlice &
  AdressesSlice;

/**
 * Store global de l'app, composé de slices indépendantes par domaine.
 *
 * Seul le slice panier (`items` + `restaurantSlug`) est persisté via
 * AsyncStorage : l'utilisateur retrouve son panier après avoir fermé l'app.
 * Les données d'authentification (token, client) ne sont PAS dans la liste
 * `partialize` : elles restent en mémoire uniquement et sont rechargées par
 * `authSlice` depuis SecureStore au démarrage.
 */
export const useStore = create<UnifiedStore>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createPanierSlice(...args),
      ...createCarteSlice(...args),
      ...createFavorisSlice(...args),
      ...createAdressesSlice(...args),
    }),
    {
      name: "toutci-panier-v1",
      storage: createJSONStorage(() => AsyncStorage),
      // Ne persister QUE le panier — jamais les données sensibles auth.
      partialize: (state) => ({
        items: state.items,
        restaurantSlug: state.restaurantSlug,
      }),
    },
  ),
);
