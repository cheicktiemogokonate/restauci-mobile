import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

import {
  parseStoredAddressIndex,
  parseStoredAddresses,
  parseStoredCart,
  parseStoredFavorites,
  type StoredCartData,
} from "@/domain/localData";
import { normaliserAdresses } from "@/lib/adresses";
import type { AdresseLocale, FavoriteRestaurant } from "@/types";

export const GUEST_LOCAL_DATA_OWNER = "guest";

const LEGACY_CART_KEY = "toutci-panier-v1";
const LEGACY_FAVORITES_KEY = "favorite_restaurants_v1";
const LEGACY_ADDRESSES_KEY = "saved_addresses_v1";

const CART_KEY_PREFIX = "toutci-cart-v2";
const FAVORITES_KEY_PREFIX = "toutci-favorites-v2";
const ADDRESSES_KEY_PREFIX = "toutci-addresses-v2";
const ADDRESS_ITEM_KEY_PREFIX = "toutci-address-v3";
const MIGRATION_KEY_PREFIX = "toutci-local-data-migration-v2";

export type StoredCart = StoredCartData;

const EMPTY_CART: StoredCartData = {
  items: [],
  restaurantSlug: null,
};

let cartWriteQueue: Promise<void> = Promise.resolve();
let favoritesWriteQueue: Promise<void> = Promise.resolve();
let addressesWriteQueue: Promise<void> = Promise.resolve();

/**
 * SecureStore n'accepte que les caractères alphanumériques, ".", "-" et "_"
 * dans ses clés. L'encodage hexadécimal conserve l'identifiant sans collision
 * liée au remplacement de caractères.
 */
function encodeOwner(ownerId: string): string {
  return Array.from(ownerId)
    .map((character) => character.codePointAt(0)?.toString(16) ?? "")
    .join("-");
}

function scopedKey(prefix: string, ownerId: string): string {
  return `${prefix}-${encodeOwner(ownerId)}`;
}

function migrationKey(domain: string): string {
  return `${MIGRATION_KEY_PREFIX}-${domain}`;
}

function addressItemKey(ownerId: string, addressId: string): string {
  return `${ADDRESS_ITEM_KEY_PREFIX}-${encodeOwner(ownerId)}-${encodeOwner(addressId)}`;
}

async function writeAddressSnapshot(
  ownerId: string,
  addresses: AdresseLocale[],
): Promise<void> {
  const indexKey = scopedKey(ADDRESSES_KEY_PREFIX, ownerId);
  const previousValue = await SecureStore.getItemAsync(indexKey);
  const previousIds =
    parseStoredAddressIndex(previousValue) ??
    parseStoredAddresses(previousValue).map((address) => address.id);
  const normalized = normaliserAdresses(addresses);

  // L'index n'est remplacé qu'une fois toutes les entrées écrites. Une panne
  // intermédiaire laisse donc l'ancien snapshot lisible.
  await Promise.all(
    normalized.map((address) =>
      SecureStore.setItemAsync(
        addressItemKey(ownerId, address.id),
        JSON.stringify({ version: 3, data: [address] }),
      ),
    ),
  );
  await SecureStore.setItemAsync(
    indexKey,
    JSON.stringify({
      version: 3,
      ids: normalized.map((address) => address.id),
    }),
  );

  const nextIds = new Set(normalized.map((address) => address.id));
  await Promise.allSettled(
    previousIds
      .filter((id) => !nextIds.has(id))
      .map((id) => SecureStore.deleteItemAsync(addressItemKey(ownerId, id))),
  );
}

async function markAsyncLegacyMigration(domain: string): Promise<void> {
  await AsyncStorage.setItem(migrationKey(domain), "done");
}

async function isAsyncLegacyMigrationDone(domain: string): Promise<boolean> {
  return (await AsyncStorage.getItem(migrationKey(domain))) === "done";
}

async function isSecureLegacyMigrationDone(
  domain: string,
): Promise<boolean> {
  return (await SecureStore.getItemAsync(migrationKey(domain))) === "done";
}

async function finishSecureLegacyMigration(
  domain: string,
  legacyKey: string,
): Promise<void> {
  // Le marqueur sécurisé évite qu'une ancienne valeur du trousseau iOS soit
  // réattribuée après une réinstallation, même si sa suppression échoue.
  await Promise.allSettled([
    SecureStore.deleteItemAsync(legacyKey),
    SecureStore.setItemAsync(migrationKey(domain), "done"),
  ]);
}

export async function readFavorites(
  ownerId: string,
): Promise<FavoriteRestaurant[]> {
  await favoritesWriteQueue;

  const key = scopedKey(FAVORITES_KEY_PREFIX, ownerId);
  const scopedValue = await AsyncStorage.getItem(key);
  if (scopedValue !== null) {
    if (!(await isSecureLegacyMigrationDone("favorites"))) {
      await finishSecureLegacyMigration(
        "favorites",
        LEGACY_FAVORITES_KEY,
      );
    }
    return parseStoredFavorites(scopedValue);
  }

  if (await isSecureLegacyMigrationDone("favorites")) return [];

  const legacyValue = await SecureStore.getItemAsync(LEGACY_FAVORITES_KEY);
  const favorites = parseStoredFavorites(legacyValue);
  if (legacyValue !== null) {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ version: 2, data: favorites }),
    );
  }
  await finishSecureLegacyMigration("favorites", LEGACY_FAVORITES_KEY);
  return favorites;
}

export async function writeFavorites(
  ownerId: string,
  favorites: FavoriteRestaurant[],
): Promise<void> {
  const write = favoritesWriteQueue.then(() =>
    AsyncStorage.setItem(
      scopedKey(FAVORITES_KEY_PREFIX, ownerId),
      JSON.stringify({ version: 2, data: favorites }),
    ),
  );

  favoritesWriteQueue = write.catch(() => {});
  return write;
}

export async function readAddresses(
  ownerId: string,
): Promise<AdresseLocale[]> {
  await addressesWriteQueue;

  const key = scopedKey(ADDRESSES_KEY_PREFIX, ownerId);
  const scopedValue = await SecureStore.getItemAsync(key);
  if (scopedValue !== null) {
    if (!(await isSecureLegacyMigrationDone("addresses"))) {
      await finishSecureLegacyMigration(
        "addresses",
        LEGACY_ADDRESSES_KEY,
      );
    }
    const indexedIds = parseStoredAddressIndex(scopedValue);
    if (indexedIds) {
      const values = await Promise.all(
        indexedIds.map((id) =>
          SecureStore.getItemAsync(addressItemKey(ownerId, id)),
        ),
      );
      const adresses = normaliserAdresses(
        values.flatMap((value) => parseStoredAddresses(value)),
      );
      if (
        adresses.length !== indexedIds.length ||
        adresses.some((address, index) => address.id !== indexedIds[index])
      ) {
        await writeAddressSnapshot(ownerId, adresses);
      }
      return adresses;
    }

    // Migration transparente de l'ancien tableau monolithique v2.
    const adressesNormalisees = normaliserAdresses(
      parseStoredAddresses(scopedValue),
    );
    await writeAddressSnapshot(ownerId, adressesNormalisees);
    return adressesNormalisees;
  }

  if (await isSecureLegacyMigrationDone("addresses")) return [];

  const legacyValue = await SecureStore.getItemAsync(LEGACY_ADDRESSES_KEY);
  const addresses = normaliserAdresses(
    parseStoredAddresses(legacyValue),
  );
  if (legacyValue !== null) {
    await writeAddressSnapshot(ownerId, addresses);
  }
  await finishSecureLegacyMigration("addresses", LEGACY_ADDRESSES_KEY);
  return addresses;
}

export async function writeAddresses(
  ownerId: string,
  addresses: AdresseLocale[],
): Promise<void> {
  const write = addressesWriteQueue.then(() =>
    writeAddressSnapshot(ownerId, addresses),
  );

  addressesWriteQueue = write.catch(() => {});
  return write;
}

export async function waitForCartWrites(): Promise<void> {
  await cartWriteQueue;
}

export async function readCart(ownerId: string): Promise<StoredCart> {
  await waitForCartWrites();

  const key = scopedKey(CART_KEY_PREFIX, ownerId);
  const scopedValue = await AsyncStorage.getItem(key);
  if (scopedValue !== null) {
    if (!(await isAsyncLegacyMigrationDone("cart"))) {
      await markAsyncLegacyMigration("cart");
    }
    return parseStoredCart(scopedValue);
  }

  if (await isAsyncLegacyMigrationDone("cart")) return EMPTY_CART;

  const legacyValue = await AsyncStorage.getItem(LEGACY_CART_KEY);
  const cart = parseStoredCart(legacyValue);
  if (legacyValue !== null) {
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ version: 2, state: cart }),
    );
  }
  await markAsyncLegacyMigration("cart");
  return cart;
}

export function writeCart(ownerId: string, cart: StoredCart): Promise<void> {
  const write = cartWriteQueue.then(() =>
    AsyncStorage.setItem(
      scopedKey(CART_KEY_PREFIX, ownerId),
      JSON.stringify({ version: 2, state: cart }),
    ),
  );

  // Une écriture échouée ne doit pas empêcher toutes les suivantes.
  cartWriteQueue = write.catch(() => {});
  return write;
}
