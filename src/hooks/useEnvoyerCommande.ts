import { ENDPOINTS } from "@/constants/api";
import { buildOrderPrevalidationRequest } from "@/domain/checkout";
import { apiFetch } from "@/lib/api";
import { invalidateCommandeQueries } from "@/lib/commandeQueryCache";
import {
  commandeCreationDataSchema,
  orderPrevalidationDataSchema,
  parseApiSuccess,
} from "@/lib/apiValidation";
import type {
  CommandeCreatedResponse,
  CommandePaymentResponse,
  CommandePayload,
} from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useEnvoyerCommande() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommandePayload) => {
      const prevalidateResponse = await apiFetch<unknown>(
        ENDPOINTS.clientCommandesPrevalidate,
        {
          method: "POST",
          body: JSON.stringify(buildOrderPrevalidationRequest(payload)),
        },
      );
      const prevalidation = parseApiSuccess<{ valid: boolean }>(
        prevalidateResponse,
        orderPrevalidationDataSchema,
        "commandes/prevalidate",
      );

      if (!prevalidation.data.valid) {
        throw new Error(
          "Cette commande n’est pas possible depuis votre position actuelle.",
        );
      }

      const payloadResponse = await apiFetch<unknown>(ENDPOINTS.clientCommandes, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const response = parseApiSuccess<{
        commande: CommandeCreatedResponse;
        replayed: boolean;
        payment: CommandePaymentResponse;
      }>(
        payloadResponse,
        commandeCreationDataSchema,
        "commandes/creation",
      );

      const commande = response.data.commande;
      const id = commande.id;

      if (!id && __DEV__) {
        console.warn(
          "[useEnvoyerCommande] commande créée sans id exploitable",
        );
      }

      return {
        id,
        commande,
        payment: response.data.payment,
        replayed: response.data.replayed,
      };
    },
    onSuccess: async () => {
      await invalidateCommandeQueries(queryClient);
    },
  });
}
