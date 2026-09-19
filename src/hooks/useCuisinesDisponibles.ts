import { useMemo } from "react";
import type { RestaurantDiscoveryLocation } from "@/domain/restaurantSearch";
import { useRestaurantsProches } from "./useRestaurantsProches";

/**
 * Catégories de cuisine réellement disponibles autour de l'utilisateur.
 *
 * Dérivées du champ `cuisines[]` des établissements renvoyés par l'API, au lieu
 * d'une liste codée en dur : on n'affiche jamais un filtre qui ne rendrait
 * aucun résultat. La requête est volontairement faite sans le paramètre
 * `cuisine`, donc elle partage le cache TanStack Query de la liste non filtrée.
 */
export function useCuisinesDisponibles(
  location: RestaurantDiscoveryLocation | null,
) {
  const { data: restaurants, isLoading } = useRestaurantsProches(location);

  const cuisines = useMemo(() => {
    if (!restaurants?.length) return [];

    const uniques = new Set<string>();
    for (const r of restaurants) {
      for (const c of r.cuisines ?? []) {
        const label = c?.trim();
        if (label) uniques.add(label);
      }
    }

    return Array.from(uniques).sort((a, b) => a.localeCompare(b, "fr"));
  }, [restaurants]);

  return { cuisines, isLoading };
}
