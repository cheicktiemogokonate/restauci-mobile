import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import {
  commandeCancellationDataSchema,
  parseApiSuccess,
} from "@/lib/apiValidation";
import { invalidateCommandeQueries } from "@/lib/commandeQueryCache";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useAnnulerCommande() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const payload = await apiFetch<unknown>(ENDPOINTS.clientCommande(id), {
        method: "PATCH",
      });
      return parseApiSuccess(
        payload,
        commandeCancellationDataSchema,
        "commandes/annulation",
      ).data;
    },
    onSuccess: async () => {
      await invalidateCommandeQueries(queryClient);
    },
  });
}
