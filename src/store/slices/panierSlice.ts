import type { CommandeItem } from "@/types";
import type { StateCreator } from "zustand";

export interface PanierSlice {
  items: CommandeItem[];
  restaurantSlug: string | null;
  ajouterItem: (
    plat: { id: string; nom: string; prix: number; photoUrl?: string | null },
    quantite?: number,
    restaurantSlug?: string,
  ) => void;
  retirerItem: (platId: string) => void;
  viderPanier: () => void;
  nombreArticles: () => number;
  sousTotal: () => number;
}

export const createPanierSlice: StateCreator<PanierSlice> = (set, get) => ({
  items: [],
  restaurantSlug: null,

  ajouterItem(plat, quantite = 1, restaurantSlug) {
    const state = get();
    const existingItem = state.items.find((item) => item.platId === plat.id);

    if (existingItem) {
      const updatedItems = state.items.map((item) =>
        item.platId === plat.id
          ? { ...item, quantite: item.quantite + quantite }
          : item,
      );
      set({
        items: updatedItems,
        restaurantSlug: restaurantSlug ?? state.restaurantSlug,
      });
    } else {
      set({
        items: [
          ...state.items,
          {
            platId: plat.id,
            nom: plat.nom,
            prix: plat.prix,
            quantite,
            photoUrl: plat.photoUrl ?? null,
          },
        ],
        restaurantSlug: restaurantSlug ?? state.restaurantSlug,
      });
    }
  },

  retirerItem(platId) {
    const state = get();
    const existingItem = state.items.find((item) => item.platId === platId);
    if (!existingItem) return;

    if (existingItem.quantite <= 1) {
      const updatedItems = state.items.filter((item) => item.platId !== platId);
      set({
        items: updatedItems,
        restaurantSlug: updatedItems.length > 0 ? state.restaurantSlug : null,
      });
    } else {
      const updatedItems = state.items.map((item) =>
        item.platId === platId
          ? { ...item, quantite: item.quantite - 1 }
          : item,
      );
      set({ items: updatedItems });
    }
  },

  viderPanier() {
    set({ items: [], restaurantSlug: null });
  },

  nombreArticles() {
    return get().items.reduce((sum, item) => sum + item.quantite, 0);
  },

  sousTotal() {
    return get().items.reduce(
      (sum, item) => sum + item.prix * item.quantite,
      0,
    );
  },
});
