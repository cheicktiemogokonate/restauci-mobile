import { Button } from "@/components/ui/button";
import { ErrorView } from "@/components/ui/ErrorView";
import { Text as ButtonText } from "@/components/ui/text";
import { useCancelResidenceReservation, useClientReservation, useRetryResidencePayment } from "@/hooks/useResidences";
import { formatPrix } from "@/lib/format";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { CalendarDays, ChevronLeft, MapPin, Users } from "lucide-react-native";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const reservation = useClientReservation(id ?? null);
  const cancel = useCancelResidenceReservation();
  const retryPayment = useRetryResidencePayment();

  if (reservation.isPending) return <SafeAreaView className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#14532d" /></SafeAreaView>;
  if (reservation.isError || !reservation.data) return <SafeAreaView className="flex-1 bg-white"><ErrorView title="Réservation introuvable" message={reservation.error?.message ?? "Impossible de charger cette réservation."} onRetry={() => void reservation.refetch()} /></SafeAreaView>;
  const item = reservation.data;
  const status = item.status === "confirmee" ? "Réservation confirmée" : item.status === "annulee" ? "Réservation annulée" : "Paiement en attente";

  const confirmCancel = () => Alert.alert("Annuler la réservation ?", "Cette action libérera les dates du séjour.", [{ text: "Garder", style: "cancel" }, { text: "Annuler la réservation", style: "destructive", onPress: () => cancel.mutate(item.id, { onError: (error) => Alert.alert("Annulation impossible", error.message) }) }]);
  const pay = () => retryPayment.mutate({ id: item.id, method: item.paymentMethod }, { onSuccess: ({ authorizationUrl }) => void Linking.openURL(authorizationUrl).catch(() => Alert.alert("Lien indisponible", "Réessayez dans quelques instants.")), onError: (error) => Alert.alert("Paiement impossible", error.message) });

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-ink-50" edges={["top"]}>
        <View className="flex-row items-center px-4 py-3"><Pressable onPress={() => router.replace("/(tabs)/residences")} className="h-10 w-10 items-center justify-center rounded-full bg-white"><ChevronLeft color="#111827" /></Pressable><Text className="ml-3 text-xl font-extrabold text-ink-900">Détails du séjour</Text></View>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
          <View className="overflow-hidden rounded-3xl bg-white border border-ink-100">
            <View className="h-56 bg-ink-100">{item.residenceCoverUrl ? <Image source={{ uri: item.residenceCoverUrl }} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : null}</View>
            <View className="p-5"><Text className="text-2xl font-extrabold text-ink-900">{item.residenceTitle}</Text><View className="mt-2 flex-row items-center gap-2"><MapPin size={16} color="#6b7280" /><Text className="text-ink-500">{item.residenceCity}</Text></View><View className={`mt-4 self-start rounded-full px-3 py-2 ${item.status === "confirmee" ? "bg-green-100" : item.status === "annulee" ? "bg-red-100" : "bg-amber-100"}`}><Text className="text-xs font-bold text-ink-800">{status}</Text></View></View>
          </View>
          <View className="mt-4 rounded-3xl bg-white p-5 border border-ink-100">
            <View className="flex-row items-center gap-3"><CalendarDays color="#14532d" /><View><Text className="text-xs uppercase text-ink-400">Dates</Text><Text className="font-bold text-ink-900">{item.checkIn} → {item.checkOut}</Text></View></View>
            <View className="mt-5 flex-row items-center gap-3"><Users color="#14532d" /><View><Text className="text-xs uppercase text-ink-400">Voyageurs</Text><Text className="font-bold text-ink-900">{item.guests} · {item.nights} nuit{item.nights > 1 ? "s" : ""}</Text></View></View>
            <View className="my-5 border-t border-ink-100" /><View className="flex-row items-center justify-between"><Text className="font-semibold text-ink-600">Total</Text><Text className="text-xl font-extrabold text-brand-800">{formatPrix(item.totalFcfa)}</Text></View>
          </View>
          {item.status === "en_attente_paiement" ? <Button onPress={pay} disabled={retryPayment.isPending} className="mt-5">{retryPayment.isPending ? <ActivityIndicator color="white" /> : <ButtonText>Reprendre le paiement</ButtonText>}</Button> : null}
          {item.status !== "annulee" && item.temporalStatus === "a_venir" ? <Button variant="outline" static onPress={confirmCancel} disabled={cancel.isPending} className="mt-3"><ButtonText className="text-brand-800">Annuler la réservation</ButtonText></Button> : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
