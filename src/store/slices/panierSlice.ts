import {
  GUEST_LOCAL_DATA_OWNER,
  writeCart,
} from "@/lib/localDataStorage";
import { clampItemQuantity } from "@/domain/checkout";
import type { PanierItem } from "@/types";
import type { StateCreator } from "zustand";

import type { UnifiedStore } from "..";

export interface PanierSlice {
  items: PanierItem[];
  restaurantSlug: string | null;
  ajouterItem: (
    plat: { id: string; nom: string; prix: number; photoUrl?: string | null },
    quantite?: number,
    restaurantSlug?: string,
  ) => void;
  retirerItem: (platId: string) => void;
  supprimerItem: (platId: string) => void;
  viderPanier: () => void;
  nombreArticles: () => number;
  sousTotal: () => number;
}

export const createPanierSlice: StateCreator<
  UnifiedStore,
  [],
  [],
  PanierSlice
> = (set, get) => {
  const persistCart = (previousState: UnifiedStore): void => {
    const nextState = get();
    const ownerId = nextState.localDataOwner ?? GUEST_LOCAL_DATA_OWNER;
    const persistedItems = nextState.items;
    const persistedRestaurantSlug = nextState.restaurantSlug;

    void writeCart(ownerId, {
      items: persistedItems,
      restaurantSlug: persistedRestaurantSlug,
    }).catch(() => {
      const currentState = get();
      // Une écriture plus récente ne doit jamais être annulée par l'échec
      // d'une ancienne sauvegarde mise en file.
      if (
        (currentState.localDataOwner ?? GUEST_LOCAL_DATA_OWNER) === ownerId &&
        currentState.items === persistedItems &&
        currentState.restaurantSlug === persistedRestaurantSlug
      ) {
        set({
          items: previousState.items,
          restaurantSlug: previousState.restaurantSlug,
        });
      }
    });
  };

  return {
    items: [],
    restaurantSlug: null,

    ajouterItem(plat, quantite = 1, restaurantSlug) {
      const state = get();
      const existingItem = state.items.find((item) => item.platId === plat.id);
      const requestedQuantity = clampItemQuantity(quantite);

      if (existingItem) {
        const nextQuantity = clampItemQuantity(
          existingItem.quantite + requestedQuantity,
        );
        if (nextQuantity === existingItem.quantite) return;
        const updatedItems = state.items.map((item) =>
          item.platId === plat.id
            ? { ...item, quantite: nextQuantity }
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
              quantite: requestedQuantity,
              photoUrl: plat.photoUrl ?? null,
            },
          ],
          restaurantSlug: restaurantSlug ?? state.restaurantSlug,
        });
      }

      persistCart(state);
    },

    retirerItem(platId) {
      const state = get();
      const existingItem = state.items.find((item) => item.platId === platId);
      if (!existingItem) return;

      if (existingItem.quantite <= 1) {
        const updatedItems = state.items.filter((item) => item.platId !== platId);
        set({
          items: updatedItems,
          restaurantSlug:
            updatedItems.length > 0 ? state.restaurantSlug : null,
        });
      } else {
        const updatedItems = state.items.map((item) =>
          item.platId === platId
            ? { ...item, quantite: item.quantite - 1 }
            : item,
        );
        set({ items: updatedItems });
      }

      persistCart(state);
    },

    supprimerItem(platId) {
      const state = get();
      const updatedItems = state.items.filter((item) => item.platId !== platId);
      if (updatedItems.length === state.items.length) return;

      set({
        items: updatedItems,
        restaurantSlug:
          updatedItems.length > 0 ? state.restaurantSlug : null,
      });
      persistCart(state);
    },

    viderPanier() {
      const state = get();
      set({ items: [], restaurantSlug: null });
      persistCart(state);
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
  };
};
