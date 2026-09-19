import type { QueryClient } from "@tanstack/react-query";

export const RESIDENCE_MUTATION_QUERY_ROOTS = [
  ["reservations"],
  ["residences", "availability"],
  ["residences", "quote"],
  ["residences", "search"],
  ["notifications"],
] as const;

/** Relit toutes les projections serveur affectées par une réservation. */
export async function invalidateResidenceQueries(
  queryClient: QueryClient,
): Promise<void> {
  await Promise.all(
    RESIDENCE_MUTATION_QUERY_ROOTS.map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
}
