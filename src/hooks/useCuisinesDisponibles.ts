import type { Restaurant } from "@/types";
import { useMemo } from "react";
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
  lat: number | undefined,
  lon: number | undefined,
  rayon: number = 10,
) {
  const { data: restaurants, isLoading } = useRestaurantsProches(
    lat,
    lon,
    rayon,
  );

  const cuisines = useMemo(() => {
    if (!restaurants?.length) return [];

    const uniques = new Set<string>();
    for (const r of restaurants as Restaurant[]) {
      for (const c of r.cuisines ?? []) {
        const label = c?.trim();
        if (label) uniques.add(label);
      }
    }

    return Array.from(uniques).sort((a, b) => a.localeCompare(b, "fr"));
  }, [restaurants]);

  return { cuisines, isLoading };
}
