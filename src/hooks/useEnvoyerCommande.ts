import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import type { CommandePayload } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";



export function useEnvoyerCommande() {
  const queryClient = useQueryClient();



  return useMutation({
    mutationFn: async (payload: CommandePayload) => {
      const response = await apiFetch<any>(ENDPOINTS.clientCommandes, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      let id = "";
      if (typeof response === "string") {
        id = response;
      } else if (response.data?.commande?.id) {
        id = response.data.commande.id;
      } else if (response.data?.id) {
        id = response.data.id;
      } else if (response.id) {
        id = response.id;
      }
      return { id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
    },
  });
}