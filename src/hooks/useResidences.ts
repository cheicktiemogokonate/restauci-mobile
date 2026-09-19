import { ENDPOINTS } from "@/constants/api";
import {
  buildResidenceSearchRequest,
  isIsoResidenceDate,
  type ResidenceSearchCriteria,
} from "@/domain/residenceSearch";
import { useDebounce } from "@/hooks/useDebounce";
import { apiFetch } from "@/lib/api";
import { parseApiSuccess } from "@/lib/apiValidation";
import { invalidateResidenceQueries } from "@/lib/residenceQueryCache";
import {
  discoveryDetailOpenSchema,
  publicResidenceSchema,
  publicResidenceSearchDataSchema,
  residenceAvailabilitySchema,
  residenceCancellationSchema,
  residenceCreationSchema,
  residencePaymentSchema,
  residenceQuoteSchema,
  residenceReservationSchema,
} from "@/lib/residenceValidation";
import { useStore } from "@/store";
import type { ApiSuccess } from "@/types";
import type {
  PublicResidence,
  ResidenceAvailability,
  ResidencePaymentMethod,
  ResidenceReservation,
  ResidenceStayQuote,
} from "@/types/residences";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";

const RESIDENCE_SEARCH_PAGE_SIZE = 12;
const recordedDetailTokens = new Set<string>();

async function fetchResidenceSearchPage({
  criteria,
  page,
  signal,
}: {
  criteria: ResidenceSearchCriteria;
  page: number;
  signal?: AbortSignal;
}): Promise<ApiSuccess<{ items: PublicResidence[] }>> {
  const payload = await apiFetch<unknown>(ENDPOINTS.publicResidencesSearch, {
    method: "POST",
    skipAuth: true,
    signal,
    body: JSON.stringify(
      buildResidenceSearchRequest(
        criteria,
        page,
        RESIDENCE_SEARCH_PAGE_SIZE,
      ),
    ),
  });
  return parseApiSuccess<{ items: PublicResidence[] }>(
    payload,
    publicResidenceSearchDataSchema,
    "residences/recherche",
  );
}

export function useResidenceSearch(criteria: ResidenceSearchCriteria) {
  const destination = useDebounce(criteria.destination.trim(), 350);
  const normalizedCriteria = { ...criteria, destination };
  const query = useInfiniteQuery({
    queryKey: [
      "residences",
      "search",
      destination,
      criteria.checkIn,
      criteria.checkOut,
      criteria.guests,
    ],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      fetchResidenceSearchPage({
        criteria: normalizedCriteria,
        page: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta?.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled:
      isIsoResidenceDate(criteria.checkIn) &&
      isIsoResidenceDate(criteria.checkOut) &&
      criteria.checkOut > criteria.checkIn &&
      Number.isInteger(criteria.guests) &&
      criteria.guests >= 1,
  });

  return {
    ...query,
    data: query.data?.pages.flatMap((page) => page.data.items) ?? [],
    meta: query.data?.pages[0]?.meta,
  };
}

export function useResidence(slug: string | null) {
  return useQuery({
    queryKey: ["residences", "detail", slug],
    queryFn: async ({ signal }): Promise<PublicResidence> => {
      const payload = await apiFetch<unknown>(ENDPOINTS.publicResidence(slug!), {
        skipAuth: true,
        signal,
      });
      return parseApiSuccess<PublicResidence>(
        payload,
        publicResidenceSchema,
        "residences/detail",
      ).data;
    },
    enabled: Boolean(slug),
  });
}

export function useResidenceAvailability(residenceId: string | null) {
  return useQuery({
    queryKey: ["residences", "availability", residenceId],
    queryFn: async ({ signal }): Promise<ResidenceAvailability> => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.publicResidenceAvailability(residenceId!),
        { skipAuth: true, signal },
      );
      return parseApiSuccess<ResidenceAvailability>(
        payload,
        residenceAvailabilitySchema,
        "residences/disponibilites",
      ).data;
    },
    enabled: Boolean(residenceId),
  });
}

/** Enregistre l'ouverture issue d'une recherche sans bloquer l'écran public. */
export function useRecordResidenceDetailOpen(discoveryToken?: string) {
  useEffect(() => {
    if (!discoveryToken || recordedDetailTokens.has(discoveryToken)) return;
    recordedDetailTokens.add(discoveryToken);

    void apiFetch<unknown>(ENDPOINTS.publicDiscoveryEvents, {
      method: "POST",
      skipAuth: true,
      body: JSON.stringify({
        token: discoveryToken,
        eventType: "detail_open",
      }),
    })
      .then((payload) =>
        parseApiSuccess<{ recorded: boolean }>(
          payload,
          discoveryDetailOpenSchema,
          "residences/attribution-ouverture",
        ),
      )
      .catch(() => {
        recordedDetailTokens.delete(discoveryToken);
      });
  }, [discoveryToken]);
}

export function useResidenceQuote(input: {
  residenceId: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  return useQuery({
    queryKey: [
      "residences",
      "quote",
      input.residenceId,
      input.checkIn,
      input.checkOut,
      input.guests,
    ],
    queryFn: async ({ signal }): Promise<ResidenceStayQuote> => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.publicResidenceQuote(input.residenceId!),
        {
          method: "POST",
          skipAuth: true,
          signal,
          body: JSON.stringify({
            checkIn: input.checkIn,
            checkOut: input.checkOut,
            guests: input.guests,
          }),
        },
      );
      return parseApiSuccess<ResidenceStayQuote>(
        payload,
        residenceQuoteSchema,
        "residences/devis",
      ).data;
    },
    enabled:
      Boolean(input.residenceId) &&
      isIsoResidenceDate(input.checkIn) &&
      isIsoResidenceDate(input.checkOut) &&
      input.checkOut > input.checkIn &&
      Number.isInteger(input.guests) &&
      input.guests >= 1,
  });
}

export function useClientReservations() {
  const clientId = useStore((state) => state.client?.id ?? null);
  return useQuery({
    queryKey: ["reservations", clientId],
    queryFn: async ({ signal }): Promise<ResidenceReservation[]> => {
      const payload = await apiFetch<unknown>(ENDPOINTS.clientReservations, {
        signal,
      });
      return parseApiSuccess<ResidenceReservation[]>(
        payload,
        residenceReservationSchema.array(),
        "reservations/liste",
      ).data;
    },
    enabled: Boolean(clientId),
  });
}

export function useClientReservation(id: string | null) {
  const clientId = useStore((state) => state.client?.id ?? null);
  return useQuery({
    queryKey: ["reservations", clientId, id],
    queryFn: async ({ signal }): Promise<ResidenceReservation> => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.clientReservation(id!),
        { signal },
      );
      return parseApiSuccess<ResidenceReservation>(
        payload,
        residenceReservationSchema,
        "reservations/detail",
      ).data;
    },
    enabled: Boolean(clientId && id),
  });
}

export function useCreateResidenceReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      residenceId: string;
      checkIn: string;
      checkOut: string;
      guests: number;
      paymentMethod: ResidencePaymentMethod;
      discoveryToken?: string;
    }) => {
      const payload = await apiFetch<unknown>(ENDPOINTS.clientReservations, {
        method: "POST",
        body: JSON.stringify({ ...input, paymentReturnChannel: "mobile" }),
      });
      return parseApiSuccess<{
        reservationId: string;
        paymentId: string;
        checkoutUrl: string;
      }>(payload, residenceCreationSchema, "reservations/creation").data;
    },
    onSuccess: () => {
      void invalidateResidenceQueries(queryClient);
    },
  });
}

export function useCancelResidenceReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.clientReservationCancel(id),
        { method: "POST" },
      );
      return parseApiSuccess(
        payload,
        residenceCancellationSchema,
        "reservations/annulation",
      ).data;
    },
    onSuccess: () => {
      void invalidateResidenceQueries(queryClient);
    },
  });
}

export function useRetryResidencePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      method,
    }: {
      id: string;
      method: ResidencePaymentMethod;
    }) => {
      const payload = await apiFetch<unknown>(
        ENDPOINTS.clientReservationPayment(id),
        {
          method: "POST",
          body: JSON.stringify({ method, paymentReturnChannel: "mobile" }),
        },
      );
      return parseApiSuccess<{
        authorizationUrl: string;
        reference: string;
      }>(payload, residencePaymentSchema, "reservations/paiement").data;
    },
    onSuccess: () => {
      void invalidateResidenceQueries(queryClient);
    },
  });
}
