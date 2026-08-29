import { ENDPOINTS } from "@/constants/api";
import { useDebounce } from "@/hooks/useDebounce";
import { apiFetch } from "@/lib/api";
import { parseApiSuccess } from "@/lib/apiValidation";
import {
  publicResidenceSchema,
  publicResidenceSearchDataSchema,
  residenceCreationSchema,
  residencePaymentSchema,
  residenceQuoteSchema,
  residenceReservationSchema,
} from "@/lib/residenceValidation";
import { useStore } from "@/store";
import type {
  PublicResidence,
  ResidencePaymentMethod,
  ResidenceReservation,
  ResidenceStayQuote,
} from "@/types/residences";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export function useResidenceSearch(destination: string) {
  const normalized = useDebounce(destination.trim(), 350);
  return useQuery({
    queryKey: ["residences", "search", normalized],
    queryFn: async ({ signal }): Promise<PublicResidence[]> => {
      const payload = await apiFetch<unknown>(ENDPOINTS.publicResidencesSearch, {
        method: "POST",
        skipAuth: true,
        signal,
        body: JSON.stringify({
          destination: normalized || undefined,
          page: 1,
          limit: 24,
        }),
      });
      return parseApiSuccess<{ items: PublicResidence[] }>(
        payload,
        publicResidenceSearchDataSchema,
        "residences/recherche",
      ).data.items;
    },
  });
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

export function useResidenceQuote(input: {
  residenceId: string | null;
  checkIn: string;
  checkOut: string;
  guests: number;
}) {
  return useQuery({
    queryKey: ["residences", "quote", input],
    queryFn: async ({ signal }): Promise<ResidenceStayQuote> => {
      const payload = await apiFetch<unknown>(ENDPOINTS.publicResidenceQuote(input.residenceId!), {
        method: "POST",
        skipAuth: true,
        signal,
        body: JSON.stringify({ checkIn: input.checkIn, checkOut: input.checkOut, guests: input.guests }),
      });
      return parseApiSuccess<ResidenceStayQuote>(
        payload,
        residenceQuoteSchema,
        "residences/devis",
      ).data;
    },
    enabled: Boolean(input.residenceId && input.checkIn && input.checkOut),
  });
}

export function useClientReservations() {
  const clientId = useStore((state) => state.client?.id ?? null);
  return useQuery({
    queryKey: ["reservations", clientId],
    queryFn: async ({ signal }): Promise<ResidenceReservation[]> => {
      const payload = await apiFetch<unknown>(ENDPOINTS.clientReservations, { signal });
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
      const payload = await apiFetch<unknown>(ENDPOINTS.clientReservation(id!), { signal });
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
      return parseApiSuccess<{ reservationId: string; paymentId: string; checkoutUrl: string }>(
        payload,
        residenceCreationSchema,
        "reservations/creation",
      ).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}

export function useCancelResidenceReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const payload = await apiFetch<unknown>(ENDPOINTS.clientReservationCancel(id), {
        method: "POST",
      });
      return parseApiSuccess<unknown>(
        payload,
        z.unknown(),
        "reservations/annulation",
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
  });
}

export function useRetryResidencePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, method }: { id: string; method: ResidencePaymentMethod }) => {
      const payload = await apiFetch<unknown>(ENDPOINTS.clientReservationPayment(id), {
        method: "POST",
        body: JSON.stringify({ method, paymentReturnChannel: "mobile" }),
      });
      return parseApiSuccess<{ authorizationUrl: string; reference: string }>(
        payload,
        residencePaymentSchema,
        "reservations/paiement",
      ).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reservations"] }),
  });
}
