import { useQuery } from "@tanstack/react-query";
import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/store";

import type { CommandeSummary } from "@/types";
export function useCommandesClient() {
  const token = useStore((s) => s.token);
  return useQuery<CommandeSummary[]>({
    queryKey: ["commandes"],
    queryFn: async () => {
      const response = await apiFetch<any>(ENDPOINTS.clientCommandes);
      return response.data || [];
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!token,
  });
}