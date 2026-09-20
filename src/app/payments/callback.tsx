import { Button } from "@/components/ui/button";
import { Text as ButtonText } from "@/components/ui/text";
import { invalidateCommandeQueries } from "@/lib/commandeQueryCache";
import { invalidateResidenceQueries } from "@/lib/residenceQueryCache";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CircleCheckBig, CircleX, LoaderCircle } from "lucide-react-native";
import { useEffect } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PaymentCallbackScreen() {
  const params = useLocalSearchParams<{ payment?: string | string[]; reference?: string | string[]; type?: string | string[]; sourceId?: string | string[] }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const payment = valueOf(params.payment);
  const transactionType = valueOf(params.type);
  const sourceId = valueOf(params.sourceId);
  const confirmed = payment === "confirmed";
  const failed = payment === "failed" || payment === "error" || payment === "cancelled";
  const isResidencePayment = transactionType === "reservation_residence";
  const destination = isResidencePayment && sourceId ? `/reservations/${sourceId}` as const : sourceId ? `/(tabs)/commandes/${sourceId}` as const : "/(tabs)" as const;

  useEffect(() => {
    if (transactionType === "reservation_residence") {
      void invalidateResidenceQueries(queryClient);
    } else if (transactionType === "commande_restaurant") {
      void invalidateCommandeQueries(queryClient);
    } else {
      void Promise.all([
        invalidateCommandeQueries(queryClient),
        invalidateResidenceQueries(queryClient),
      ]);
    }
    if (!sourceId) return;
    const timer = setTimeout(() => router.replace(destination), 900);
    return () => clearTimeout(timer);
  }, [destination, queryClient, router, sourceId, transactionType]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 items-center justify-center px-8">
        {confirmed ? <CircleCheckBig size={64} color="#15803d" /> : failed ? <CircleX size={64} color={theme.danger700} /> : <LoaderCircle size={64} color={theme.green900} />}
        <Text className="mt-6 text-center text-2xl font-extrabold text-ink-900">{confirmed ? "Paiement confirmé" : failed ? "Paiement non confirmé" : "Vérification du paiement"}</Text>
        <Text className="mt-3 text-center leading-6 text-ink-500">{confirmed ? `Votre paiement a été vérifié. Nous ouvrons maintenant ${isResidencePayment ? "votre séjour" : "votre suivi"}.` : failed ? `Aucun paiement n’est considéré comme validé. Vous pourrez le reprendre depuis le détail ${isResidencePayment ? "du séjour" : "de la commande"}.` : "ToutCi vérifie le statut auprès du serveur avant de mettre à jour votre réservation ou commande."}</Text>
        <Button onPress={() => router.replace(destination)} className="mt-8 w-full"><ButtonText>Continuer</ButtonText></Button>
      </SafeAreaView>
    </>
  );
}
