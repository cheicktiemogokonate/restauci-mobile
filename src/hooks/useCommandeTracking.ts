import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/store";

export interface CommandeItemAPI {
  platId: string;
  nom: string;
  prix: number;
  quantite: number;
}

export interface TimelineEtape {
  etape: string;
  label: string;
  fait: boolean;
  actif: boolean;
  timestamp: string | null;
}

export interface CommandeDetail {
  id: string;
  numero: string;
  statut: string;
  statutLabel: string;
  estAnnulee: boolean;
  modeCommande: string;
  items: CommandeItemAPI[];
  sousTotal: number;
  fraisLivraison: number;
  total: number;
  noteClient?: string | null;
  adresseLivraison?: string | null;
  numeroTable?: string | null;
  createdAt: string;
  restaurant: { nom: string; logoUrl?: string | null } | null;
  timeline: TimelineEtape[];
}

const STATUTS_TERMINAUX = new Set(["servie", "annulee"]);
const POLL_INTERVAL_MS = 5000;

/**
 * Suit le statut d'une commande quasi en temps réel via un polling React Query.
 * Le polling s'arrête automatiquement une fois la commande dans un statut terminal.
 */
export function useCommandeTracking(commandeId: string | null) {
  const token = useStore((s) => s.token);
  const query = useQuery<CommandeDetail>({
    queryKey: ["commande-tracking", commandeId],
    queryFn: async () => {
      const response = await apiFetch<any>(`/api/v1/client/commandes/${commandeId}`);
      return response.data as CommandeDetail;
    },
    enabled: !!commandeId && !!token,
    refetchInterval: (query) => {
      const statut = query.state.data?.statut;
      if (statut && STATUTS_TERMINAUX.has(statut)) return false;
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
