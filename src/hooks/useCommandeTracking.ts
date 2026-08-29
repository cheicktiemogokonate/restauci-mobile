import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/store";

import { ENDPOINTS } from "@/constants/api";
import { isTerminalOrderStatus } from "@/domain/orderStatus";
import { commandeDetailSchema, parseApiSuccess } from "@/lib/apiValidation";
import type { CommandeDetail } from "@/types";

const POLL_INTERVAL_MS = 5000;

/**
 * Suit le statut d'une commande quasi en temps réel via un polling React Query.
 * Le polling s'arrête automatiquement une fois la commande dans un statut terminal.
 */
export function useCommandeTracking(commandeId: string | null) {
  const token = useStore((s) => s.token);
  const clientId = useStore((s) => s.client?.id);

  const query = useQuery<CommandeDetail>({
    queryKey: ["commande-tracking", clientId, commandeId],
    queryFn: async ({ signal }) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.clientCommande(commandeId!),
        { signal },
      );
      const response = parseApiSuccess<CommandeDetail>(
        payload,
        commandeDetailSchema,
        "commandes/detail",
      );
      return response.data;
    },
    enabled: !!commandeId && !!token && !!clientId,
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const statut = query.state.data?.statut;
      if (statut && isTerminalOrderStatus(statut)) return false;
      return POLL_INTERVAL_MS;
    },
  });

  return {
    commande: query.data ?? null,
    statut: query.data?.statut ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
