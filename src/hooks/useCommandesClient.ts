import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { commandeSummarySchema, parseApiSuccess } from "@/lib/apiValidation";
import { useStore } from "@/store";

import type { ApiSuccess, CommandeSummary } from "@/types";

interface CommandesClientParams {
  page?: number;
  limit?: number;
  search?: string;
}

async function fetchCommandesPage({
  page,
  limit,
  search,
  signal,
}: {
  page: number;
  limit: number;
  search?: string;
  signal?: AbortSignal;
}): Promise<ApiSuccess<CommandeSummary[]>> {
  const params = new URLSearchParams({
    page: String(Math.max(1, page)),
    limit: String(Math.min(100, Math.max(1, limit))),
  });
  if (search && search.length >= 3) {
    params.set("search", search.slice(0, 80));
  }
  const payload = await apiFetch<unknown>(
    `${ENDPOINTS.clientCommandes}?${params.toString()}`,
    { signal },
  );
  return parseApiSuccess<CommandeSummary[]>(
    payload,
    commandeSummarySchema.array(),
    "commandes/liste",
  );
}

export function useCommandesClient({
  page = 1,
  limit = 100,
  search,
}: CommandesClientParams = {}) {
  const token = useStore((s) => s.token);
  const clientId = useStore((s) => s.client?.id);

  const normalizedSearch = search?.trim();
  const query = useQuery<ApiSuccess<CommandeSummary[]>>({
    queryKey: ["commandes", clientId, page, limit, normalizedSearch],
    queryFn: async ({ signal }) => {
      return fetchCommandesPage({
        page,
        limit,
        search: normalizedSearch,
        signal,
      });
    },
    staleTime: 1000 * 60 * 2,
    enabled: !!token && !!clientId,
  });

  return {
    ...query,
    data: query.data?.data ?? [],
    meta: query.data?.meta,
  };
}

export function useCommandesInfinies({
  limit = 20,
  search,
}: Omit<CommandesClientParams, "page"> = {}) {
  const token = useStore((state) => state.token);
  const clientId = useStore((state) => state.client?.id);
  const normalizedSearch = search?.trim();

  const query = useInfiniteQuery({
    queryKey: ["commandes", "infinite", clientId, limit, normalizedSearch],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchCommandesPage({
        page: pageParam,
        limit,
        search: normalizedSearch,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNext ? lastPage.meta.page + 1 : undefined,
    staleTime: 1000 * 60 * 2,
    enabled: !!token && !!clientId,
  });

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.data) ?? [],
    meta: query.data?.pages[0]?.meta,
  };
}
