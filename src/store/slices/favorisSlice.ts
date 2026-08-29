import {
  GUEST_LOCAL_DATA_OWNER,
  readFavorites,
  writeFavorites,
} from "@/lib/localDataStorage";
import type { FavoriteRestaurant } from "@/types";
import type { StateCreator } from "zustand";

import type { UnifiedStore } from "..";

export interface FavorisSlice {
  favorites: FavoriteRestaurant[];
  isLoadingFavorites: boolean;
  toggleFavorite: (restaurant: FavoriteRestaurant) => Promise<void>;
  isFavorite: (restaurantId: string) => boolean;
  loadFavorites: () => Promise<void>;
}

export const createFavorisSlice: StateCreator<
  UnifiedStore,
  [],
  [],
  FavorisSlice
> = (set, get) => ({
  favorites: [],
  isLoadingFavorites: true,

  async loadFavorites() {
    const ownerId = get().localDataOwner;
    if (!ownerId) return;

    set({ isLoadingFavorites: true });

    try {
      const favorites = await readFavorites(ownerId);
      if (get().localDataOwner !== ownerId) return;

      set({
        favorites,
        isLoadingFavorites: false,
      });
    } catch {
      if (get().localDataOwner !== ownerId) return;
      set({ favorites: [], isLoadingFavorites: false });
    }
  },

  async toggleFavorite(restaurant) {
    const ownerId =
      get().localDataOwner ?? GUEST_LOCAL_DATA_OWNER;
    const current = get().favorites;
    const exists = current.some(
      (favorite) =>
        favorite.id === restaurant.id || favorite.slug === restaurant.slug,
    );

    const nextFavorites = exists
      ? current.filter(
          (favorite) =>
            favorite.id !== restaurant.id && favorite.slug !== restaurant.slug,
        )
      : [...current, restaurant];

    set({ favorites: nextFavorites });
    try {
      await writeFavorites(ownerId, nextFavorites);
    } catch (error) {
      // Ne pas annuler une modification plus récente terminée entre-temps.
      if (
        get().localDataOwner === ownerId &&
        get().favorites === nextFavorites
      ) {
        set({ favorites: current });
      }
      throw error;
    }
  },

  isFavorite(restaurantId) {
    return get().favorites.some((favorite) => favorite.id === restaurantId);
  },
});
