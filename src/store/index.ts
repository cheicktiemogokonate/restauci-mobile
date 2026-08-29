import { create } from "zustand";
import {
  createAdressesSlice,
  type AdressesSlice,
} from "./slices/adressesSlice";
import { createAuthSlice, type AuthSlice } from "./slices/authSlice";
import { createFavorisSlice, type FavorisSlice } from "./slices/favorisSlice";
import {
  createLocalDataSlice,
  type LocalDataSlice,
} from "./slices/localDataSlice";
import { createPanierSlice, type PanierSlice } from "./slices/panierSlice";

export type UnifiedStore = AuthSlice &
  PanierSlice &
  FavorisSlice &
  AdressesSlice &
  LocalDataSlice;

/**
 * Store global de l'app, composé de slices indépendantes par domaine.
 *
 * Les données locales sont chargées par `localDataSlice` dans un espace
 * distinct pour chaque compte (et un espace visiteur). L'authentification
 * reste rechargée depuis SecureStore par `authSlice`.
 */
export const useStore = create<UnifiedStore>()((...args) => ({
  ...createAuthSlice(...args),
  ...createPanierSlice(...args),
  ...createFavorisSlice(...args),
  ...createAdressesSlice(...args),
  ...createLocalDataSlice(...args),
}));
