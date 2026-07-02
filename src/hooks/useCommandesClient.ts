import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";

export interface CommandeSummary {
  id: string;
  numero: string;
  statut: string;
  total: number;
  createdAt: string;
  restaurantNom?: string;
  modeCommande: string;
}

export function useCommandesClient() {
  return useQuery<CommandeSummary[]>({
    queryKey: ["commandes"],
    queryFn: () => apiFetch<CommandeSummary[]>(ENDPOINTS.clientCommandes),
    staleTime: 1000 * 60 * 2,
  });
}