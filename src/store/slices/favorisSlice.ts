import type { FavoriteRestaurant } from "@/types";
import * as SecureStore from "expo-secure-store";
import type { StateCreator } from "zustand";

const FAVORITES_STORAGE_KEY = "favorite_restaurants_v1";

export interface FavorisSlice {
  favorites: FavoriteRestaurant[];
  isLoadingFavorites: boolean;
  toggleFavorite: (restaurant: FavoriteRestaurant) => Promise<void>;
  isFavorite: (restaurantId: string) => boolean;
  loadFavorites: () => Promise<void>;
}

export const createFavorisSlice: StateCreator<FavorisSlice> = (set, get) => ({
  favorites: [],
  isLoadingFavorites: true,

  async loadFavorites() {
    try {
      const stored = await SecureStore.getItemAsync(FAVORITES_STORAGE_KEY);
      if (!stored) {
        set({ favorites: [], isLoadingFavorites: false });
        return;
      }

      const parsed = JSON.parse(stored) as FavoriteRestaurant[];
      set({
        favorites: Array.isArray(parsed) ? parsed : [],
        isLoadingFavorites: false,
      });
    } catch {
      set({ favorites: [], isLoadingFavorites: false });
    }
  },

  async toggleFavorite(restaurant) {
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
    await SecureStore.setItemAsync(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(nextFavorites),
    );
  },

  isFavorite(restaurantId) {
    return get().favorites.some((favorite) => favorite.id === restaurantId);
  },
});
