import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import {
  commandeCreationDataSchema,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
    },
  });
}
