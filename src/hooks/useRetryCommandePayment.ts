import { ENDPOINTS } from "@/constants/api";
import { apiFetch } from "@/lib/api";
import { parseApiSuccess, paymentInitializationSchema } from "@/lib/apiValidation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useRetryCommandePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, method }: { id: string; method: "mobile_money" | "card" }) => {
      const payload = await apiFetch<unknown>(ENDPOINTS.clientCommandePayment(id), {
        method: "POST",
        body: JSON.stringify({ method, paymentReturnChannel: "mobile" }),
      });
      return parseApiSuccess<{ authorizationUrl: string; reference: string }>(
        payload,
        paymentInitializationSchema,
        "commandes/paiement",
      ).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commandes"] });
      queryClient.invalidateQueries({ queryKey: ["commande-tracking"] });
    },
  });
}
