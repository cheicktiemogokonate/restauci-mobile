import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import type { CategorieAvecPlats, CreneauHoraire, Restaurant } from "@/types";
import { useQuery } from "@tanstack/react-query";

interface MenuComplet {
  restaurant?: Restaurant | null;
  categories: CategorieAvecPlats[];
  creneaux: CreneauHoraire[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object";
}

function normalizeMenuResponse(response: unknown): MenuComplet {
  const payload =
    isRecord(response) && "data" in response ? response.data : response;

  if (!isRecord(payload) && !Array.isArray(payload)) {
    return { restaurant: null, categories: [], creneaux: [] };
  }

  const rawCategories = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.categories)
      ? payload.categories
      : [];

  const categories = rawCategories.filter(isRecord).map((item) => ({
    ...(item as Record<string, unknown>),
    plats: Array.isArray(item.plats)
      ? item.plats
      : Array.isArray(item.items)
        ? item.items
        : [],
    creneau: item.creneau ?? null,
  })) as CategorieAvecPlats[];

  return {
    restaurant:
      isRecord(payload) && isRecord(payload.restaurant)
        ? (payload.restaurant as Restaurant)
        : null,
    categories,
    creneaux: Array.isArray(payload.creneaux)
      ? (payload.creneaux as CreneauHoraire[])
      : [],
  };
}

export function useMenuRestaurant(slug: string | null) {
  return useQuery<MenuComplet>({
    queryKey: ["menu-restaurant", slug],
    queryFn: async () => {
      const response = await apiFetch<
        ApiResponse<MenuComplet> | MenuComplet | unknown
      >(ENDPOINTS.restaurantMenu(slug!));

      return normalizeMenuResponse(response);
    },
    enabled: !!slug,
  });
}
