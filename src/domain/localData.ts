import { z } from "zod";

import type { AdresseLocale, FavoriteRestaurant, PanierItem } from "../types";

export interface StoredCartData {
  items: PanierItem[];
  restaurantSlug: string | null;
}

const EMPTY_CART: StoredCartData = {
  items: [],
  restaurantSlug: null,
};

const favoriteSchema = z.object({
  id: z.string().min(1),
  nom: z.string().min(1),
  slug: z.string().min(1),
  logoUrl: z.string().nullable().optional(),
  banniereUrl: z.string().nullable().optional(),
});

const addressSchema = z.object({
  id: z.string().min(1),
  libelle: z.string().min(1),
  adresse: z.string().min(1),
  ville: z.string().nullable().optional(),
  codePostal: z.string().nullable().optional(),
  pays: z.string().nullable().optional(),
  latitude: z.number().finite().nullable().optional(),
  longitude: z.number().finite().nullable().optional(),
  estParDefaut: z.boolean().optional(),
});

const addressIndexSchema = z.object({
  version: z.literal(3),
  ids: z.array(z.string().min(1)).max(10),
});

const cartItemSchema = z.object({
  platId: z.string().min(1),
  nom: z.string().min(1),
  prix: z.number().finite().int().nonnegative(),
  quantite: z.number().int().min(1).max(20),
  note: z.string().optional(),
  photoUrl: z.string().nullable(),
});

function parseArray<T>(value: string | null, schema: z.ZodType<T>): T[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    const candidate =
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as Record<string, unknown>).data)
        ? (parsed as { data: unknown[] }).data
        : parsed;
    if (!Array.isArray(candidate)) return [];

    return candidate.flatMap((item) => {
      const result = schema.safeParse(item);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function parseStoredFavorites(
  value: string | null,
): FavoriteRestaurant[] {
  return parseArray(value, favoriteSchema);
}

export function parseStoredAddresses(value: string | null): AdresseLocale[] {
  return parseArray(value, addressSchema);
}

export function parseStoredAddressIndex(value: string | null): string[] | null {
  if (!value) return null;
  try {
    const result = addressIndexSchema.safeParse(JSON.parse(value) as unknown);
    return result.success ? Array.from(new Set(result.data.ids)) : null;
  } catch {
    return null;
  }
}

export function parseStoredCart(value: string | null): StoredCartData {
  if (!value) return EMPTY_CART;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return EMPTY_CART;

    const candidate = parsed as Record<string, unknown>;
    const state =
      candidate.state && typeof candidate.state === "object"
        ? (candidate.state as Record<string, unknown>)
        : candidate;

    const items = Array.isArray(state.items)
      ? state.items.flatMap((item) => {
          const result = cartItemSchema.safeParse(item);
          return result.success ? [result.data] : [];
        })
      : [];

    return {
      items,
      restaurantSlug:
        items.length > 0 && typeof state.restaurantSlug === "string"
          ? state.restaurantSlug
          : null,
    };
  } catch {
    return EMPTY_CART;
  }
}
