import {
  GUEST_LOCAL_DATA_OWNER,
  readAddresses,
  readCart,
  readFavorites,
  writeCart,
} from "@/lib/localDataStorage";
import type { StateCreator } from "zustand";

import type { UnifiedStore } from "..";

export interface LocalDataSlice {
  localDataOwner: string | null;
  isLoadingLocalData: boolean;
  activateLocalDataOwner: (
    ownerId: string,
    options?: { transferGuestCart?: boolean },
  ) => Promise<void>;
}

let activationId = 0;

export const createLocalDataSlice: StateCreator<
  UnifiedStore,
  [],
  [],
  LocalDataSlice
> = (set, get) => ({
  localDataOwner: null,
  isLoadingLocalData: true,

  async activateLocalDataOwner(ownerId, options) {
    const requestId = ++activationId;
    const previousState = get();
    const shouldTransferGuestCart =
      options?.transferGuestCart === true &&
      ownerId !== GUEST_LOCAL_DATA_OWNER &&
      previousState.localDataOwner === GUEST_LOCAL_DATA_OWNER;
    const guestCart =
      shouldTransferGuestCart && previousState.items.length > 0
        ? {
            items: previousState.items,
            restaurantSlug: previousState.restaurantSlug,
          }
        : null;

    // Effacement synchrone : aucune donnée du propriétaire précédent ne peut
    // apparaître pendant le chargement du nouvel espace.
    set({
      localDataOwner: ownerId,
      isLoadingLocalData: true,
      favorites: [],
      isLoadingFavorites: true,
      adresses: [],
      isLoadingAdresses: true,
      items: [],
      restaurantSlug: null,
    });

    const cartPromise = guestCart
      ? (async () => {
          await writeCart(ownerId, guestCart);
          try {
            await writeCart(GUEST_LOCAL_DATA_OWNER, {
              items: [],
              restaurantSlug: null,
            });
          } catch (error) {
            // Le panier visiteur contient potentiellement des données d'un
            // autre utilisateur. Si sa suppression échoue, annuler aussi la
            // copie pour éviter une attribution ambiguë au prochain démarrage.
            await writeCart(ownerId, {
              items: [],
              restaurantSlug: null,
            }).catch(() => {});
            throw error;
          }
          return guestCart;
        })()
      : readCart(ownerId);

    const [favoritesResult, addressesResult, cartResult] =
      await Promise.allSettled([
        readFavorites(ownerId),
        readAddresses(ownerId),
        cartPromise,
      ]);

    if (
      requestId !== activationId ||
      get().localDataOwner !== ownerId
    ) {
      return;
    }

    const cart =
      cartResult.status === "fulfilled"
        ? cartResult.value
        : { items: [], restaurantSlug: null };

    set({
      favorites:
        favoritesResult.status === "fulfilled"
          ? favoritesResult.value
          : [],
      isLoadingFavorites: false,
      adresses:
        addressesResult.status === "fulfilled"
          ? addressesResult.value
          : [],
      isLoadingAdresses: false,
      items: cart.items,
      restaurantSlug: cart.restaurantSlug,
      isLoadingLocalData: false,
    });
  },
});
