import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import type { CommandeCreatedResponse, CommandePayload } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useEnvoyerCommande() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CommandePayload) => {
      const response = await apiFetch<{
        success: boolean;
        data: CommandeCreatedResponse;
      }>(ENDPOINTS.clientCommandes, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Extraction robuste de l'id selon les variantes de réponse connues.
      // L'ordre suit ce que l'API retourne en production :
      //   {success, data: {id, numero, ...}}
      const data = response?.data as Partial<CommandeCreatedResponse> & {
        commande?: Partial<CommandeCreatedResponse>;
      };
      const id =
        data?.id ??
        data?.commande?.id ??
        // fallback de dernier recours : numero de commande lisible
        data?.numero ??
        data?.commande?.numero ??
        "";

      if (!id) {
        // La commande a été créée côté serveur mais on ne peut pas naviguer
        // : on log et on laisse l'appelant gérer (affichage erreur ou retour home).
        console.warn(
          "[useEnvoyerCommande] commande créée sans id exploitable",
          response,
        );
      }

      return { id, commande: data as CommandeCreatedResponse };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
    },
  });
}