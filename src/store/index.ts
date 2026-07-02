import { create } from "zustand";
import { createAuthSlice, type AuthSlice } from "./slices/authSlice";
import { createPanierSlice, type PanierSlice } from "./slices/panierSlice";
import { createCarteSlice, type CarteSlice } from "./slices/carteSlice";

export type UnifiedStore = AuthSlice & PanierSlice & CarteSlice;

/**
 * Store global de l'app, composé de slices indépendantes par domaine
 * (auth, panier, carte). Un seul store zustand reste exposé pour éviter
 * les re-renders multiples liés à plusieurs providers, mais chaque slice
 * est définie et testable séparément dans `./slices`.
 */
export const useStore = create<UnifiedStore>()((...args) => ({
  ...createAuthSlice(...args),
  ...createPanierSlice(...args),
  ...createCarteSlice(...args),
}));
