import type { QueryClient } from "@tanstack/react-query";

export const COMMANDE_QUERY_ROOTS = [
  ["commandes"],
  ["commande-tracking"],
  ["livraison"],
  ["notifications"],
] as const;

/**
 * Une mutation de commande ou de livraison peut modifier plusieurs projections
 * serveur en une seule transaction. Elles sont toutes relues au lieu de
 * reconstruire localement l'état métier.
 */
export async function invalidateCommandeQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all(
    COMMANDE_QUERY_ROOTS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
