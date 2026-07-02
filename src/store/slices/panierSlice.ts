import type { StateCreator } from "zustand";
import type { CommandeItem } from "@/types";

export interface PanierSlice {
  items: CommandeItem[];
  restaurantId: string | null;
  ajouterItem: (
    plat: { id: string; nom: string; prix: number },
    quantite?: number,
    restaurantId?: string
  ) => void;
  retirerItem: (platId: string) => void;
  viderPanier: () => void;
  nombreArticles: () => number;
  sousTotal: () => number;
}

export const createPanierSlice: StateCreator<PanierSlice> = (set, get) => ({
  items: [],
  restaurantId: null,

  ajouterItem(plat, quantite = 1, restaurantId) {
    const state = get();
    const existingItem = state.items.find((item) => item.platId === plat.id);

    if (existingItem) {
      const updatedItems = state.items.map((item) =>
        item.platId === plat.id
          ? { ...item, quantite: item.quantite + quantite }
          : item
      );
      set({
        items: updatedItems,
        restaurantId: restaurantId ?? state.restaurantId,
      });
    } else {
      set({
        items: [
          ...state.items,
          { platId: plat.id, nom: plat.nom, prix: plat.prix, quantite },
        ],
        restaurantId: restaurantId ?? state.restaurantId,
      });
    }
  },

  retirerItem(platId) {
    const state = get();
    const existingItem = state.items.find((item) => item.platId === platId);
    if (!existingItem) return;

    if (existingItem.quantite <= 1) {
      const updatedItems = state.items.filter(
        (item) => item.platId !== platId
      );
      set({
        items: updatedItems,
        restaurantId: updatedItems.length > 0 ? state.restaurantId : null,
      });
    } else {
      const updatedItems = state.items.map((item) =>
        item.platId === platId
          ? { ...item, quantite: item.quantite - 1 }
          : item
      );
      set({ items: updatedItems });
    }
  },

  viderPanier() {
    set({ items: [], restaurantId: null });
  },

  nombreArticles() {
    return get().items.reduce((sum, item) => sum + item.quantite, 0);
  },

  sousTotal() {
    return get().items.reduce(
      (sum, item) => sum + item.prix * item.quantite,
      0
    );
  },
});
