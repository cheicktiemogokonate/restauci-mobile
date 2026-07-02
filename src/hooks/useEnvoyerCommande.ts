import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/store";
import type { CommandePayload } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useEnvoyerCommande() {
  const queryClient = useQueryClient();
  const viderPanier = useStore((s) => s.viderPanier);

  return useMutation({
    mutationFn: (payload: CommandePayload) =>
      apiFetch<{ id: string }>(ENDPOINTS.clientCommandes, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      viderPanier();
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
    },
  });
}