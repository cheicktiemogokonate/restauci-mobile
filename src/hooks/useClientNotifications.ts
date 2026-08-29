import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { clientNotificationListSchema, parseApiSuccess } from "@/lib/apiValidation";
import { useStore } from "@/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

export interface ClientNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  linkType: string | null;
  linkId: string | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export function useClientNotifications() {
  const clientId = useStore((state) => state.client?.id ?? null);
  return useQuery({
    queryKey: ["notifications", clientId],
    queryFn: async ({ signal }): Promise<{ items: ClientNotification[]; unreadCount: number }> => {
      const payload = await apiFetch<unknown>(`${ENDPOINTS.clientNotifications}?page=1&limit=100`, { signal });
      return parseApiSuccess<{ items: ClientNotification[]; unreadCount: number }>(payload, clientNotificationListSchema, "notifications/liste").data;
    },
    enabled: Boolean(clientId),
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { notificationIds?: string[]; markAll?: true }) => {
      const payload = await apiFetch<unknown>(ENDPOINTS.clientNotifications, { method: "PATCH", body: JSON.stringify(input) });
      return parseApiSuccess<{ updated: number }>(payload, z.object({ updated: z.number().int().nonnegative() }), "notifications/lecture").data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
