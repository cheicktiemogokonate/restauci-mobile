import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import {
  clientDeliveryConfirmationSchema,
  clientDeliverySchema,
  parseApiSuccess,
} from "@/lib/apiValidation";
import { invalidateCommandeQueries } from "@/lib/commandeQueryCache";
import { useStore } from "@/store";
import type { ClientDelivery } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const DELIVERY_POLL_INTERVAL_MS = 5_000;

export function useClientDelivery(
  commandeId: string | null,
  enabled: boolean,
) {
  const token = useStore((state) => state.token);
  const clientId = useStore((state) => state.client?.id ?? null);

  return useQuery<ClientDelivery>({
    queryKey: ["livraison", clientId, commandeId],
    queryFn: async ({ signal }) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.clientCommandeLivraison(commandeId!),
        { signal },
      );
      return parseApiSuccess<ClientDelivery>(
        payload,
        clientDeliverySchema,
        "commandes/livraison",
      ).data;
    },
    enabled: enabled && Boolean(commandeId && token && clientId),
    refetchInterval: (query) => {
      if (query.state.status === "error") return false;
      const delivery = query.state.data;
      if (
        delivery?.completedAt ||
        delivery?.status === "echouee" ||
        delivery?.status === "annulee"
      ) {
        return false;
      }
      return DELIVERY_POLL_INTERVAL_MS;
    },
  });
}

export function useConfirmClientDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (commandeId: string) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.clientCommandeLivraisonConfirmation(commandeId),
        { method: "POST" },
      );
      return parseApiSuccess<{ verified: true }>(
        payload,
        clientDeliveryConfirmationSchema,
        "commandes/livraison/confirmation",
      ).data;
    },
    onSuccess: async () => {
      await invalidateCommandeQueries(queryClient);
    },
  });
}
