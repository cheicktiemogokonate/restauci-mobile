import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import type { CommandePayload } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CommandeResponse {
  success: boolean;
  data: {
    commande: Commande;
  };
}


export interface Commande {
  id: string;
  numero: string;
  createdAt: string;

  modeCommande: ModeCommande;
  statut: StatutCommande;

  fraisLivraison: number;
  sousTotal: number;
  total: number;

  items: CommandeItem[];
}


export interface CommandeItem {
  platId: string;
  nom: string;
  prix: number;
  quantite: number;
}


export type ModeCommande =
  | "livraison"
  | "sur_place"
  | "emporter";


export type StatutCommande =
  | "recue"
  | "confirmee"
  | "preparation"
  | "prete"
  | "livree"
  | "annulee";

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