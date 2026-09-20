import { Button } from "@/components/ui/button";
import { ErrorView } from "@/components/ui/ErrorView";
import { Text as ButtonText } from "@/components/ui/text";
import { formatResidenceDate } from "@/domain/residenceSearch";
import {
  useCancelResidenceReservation,
  useClientReservation,
  useRetryResidencePayment,
} from "@/hooks/useResidences";
import { formatPrix } from "@/lib/format";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarDays,
  ChevronLeft,
  CreditCard,
  MapPin,
  ReceiptText,
  Users,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

const temporalLabels = {
  a_venir: "Séjour à venir",
  en_cours: "Séjour en cours",
  terminee: "Séjour terminé",
} as const;

const paymentLabels = {
  pending: "Paiement en attente",
  confirmed: "Paiement confirmé",
  failed: "Paiement échoué",
  cancelled: "Paiement annulé",
} as const;

function formatServerDateTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function cancellationSourceLabel(value: string | null) {
  if (value === "client") return "Annulée par vous";
  if (value === "partner") return "Annulée par l’hôte";
  if (value === "system") return "Annulée automatiquement";
  return "Réservation annulée";
}

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const reservation = useClientReservation(id ?? null);
  const cancel = useCancelResidenceReservation();
  const retryPayment = useRetryResidencePayment();

  if (reservation.isPending) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.green900} />
      </SafeAreaView>
    );
  }
  if (reservation.isError || !reservation.data) {
    return (
      <SafeAreaView className="flex-1">
        <ErrorView
          title="Réservation introuvable"
          message={
            reservation.error?.message ??
            "Impossible de charger cette réservation."
          }
          onRetry={() => void reservation.refetch()}
        />
      </SafeAreaView>
    );
  }

  const item = reservation.data;
  const status =
    item.status === "confirmee"
      ? temporalLabels[item.temporalStatus]
      : item.status === "annulee"
        ? "Réservation annulée"
        : "Confirmation en attente";

  const confirmCancel = () =>
    Alert.alert(
      "Annuler la réservation ?",
      "Le serveur vérifiera si cette réservation peut encore être annulée.",
      [
        { text: "Garder", style: "cancel" },
        {
          text: "Annuler la réservation",
          style: "destructive",
          onPress: () =>
            cancel.mutate(item.id, {
              onSuccess: () =>
                Alert.alert(
                  "Réservation annulée",
                  "Les informations du séjour ont été actualisées.",
                ),
              onError: (error) =>
                Alert.alert("Annulation impossible", error.message),
            }),
        },
      ],
    );

  const pay = () =>
    retryPayment.mutate(
      { id: item.id, method: item.paymentMethod },
      {
        onSuccess: ({ authorizationUrl }) =>
          void Linking.openURL(authorizationUrl).catch(() =>
            Alert.alert(
              "Lien indisponible",
              "Réessayez dans quelques instants.",
            ),
          ),
        onError: (error) => Alert.alert("Paiement impossible", error.message),
      },
    );

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-row items-center px-4 py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour à mes séjours"
            onPress={() => router.replace("/(tabs)/residences")}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <ChevronLeft color={theme.ink900} />
          </Pressable>
          <Text className="ml-3 text-xl font-extrabold text-ink-900">
            Détails du séjour
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
          <View className="overflow-hidden rounded-3xl border border-ink-100 bg-white">
            <View className="h-56 bg-ink-100">
              {item.residenceCoverUrl ? (
                <Image
                  source={{ uri: item.residenceCoverUrl }}
                  contentFit="cover"
                  style={{ width: "100%", height: "100%" }}
                />
              ) : null}
            </View>
            <View className="p-5">
              <Text className="text-2xl font-extrabold text-ink-900">
                {item.residenceTitle}
              </Text>
              <View className="mt-2 flex-row items-center gap-2">
                <MapPin size={16} color={theme.ink500} />
                <Text className="text-ink-500">{item.residenceCity}</Text>
              </View>
              <View
                className={`mt-4 self-start rounded-full px-3 py-2 ${item.status === "confirmee" ? "bg-green-100" : item.status === "annulee" ? "bg-red-100" : "bg-amber-100"}`}
              >
                <Text className="text-xs font-bold text-ink-800">
                  {status}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-3xl border border-ink-100 bg-white p-5">
            <View className="flex-row items-center gap-3">
              <CalendarDays color={theme.green900} />
              <View className="flex-1">
                <Text className="text-xs uppercase text-ink-400">Dates</Text>
                <Text className="font-bold text-ink-900">
                  {formatResidenceDate(item.checkIn)} → {" "}
                  {formatResidenceDate(item.checkOut)}
                </Text>
              </View>
            </View>
            <View className="mt-5 flex-row items-center gap-3">
              <Users color={theme.green900} />
              <View>
                <Text className="text-xs uppercase text-ink-400">
                  Voyageurs
                </Text>
                <Text className="font-bold text-ink-900">
                  {item.guests} · {item.nights} nuit
                  {item.nights > 1 ? "s" : ""}
                </Text>
              </View>
            </View>
            <View className="mt-5 flex-row items-center gap-3">
              <CreditCard color={theme.green900} />
              <View>
                <Text className="text-xs uppercase text-ink-400">
                  Paiement
                </Text>
                <Text className="font-bold text-ink-900">
                  {paymentLabels[item.paymentStatus]} · {" "}
                  {item.paymentMethod === "mobile_money"
                    ? "Mobile money"
                    : "Carte bancaire"}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-3xl border border-ink-100 bg-white p-5">
            <View className="mb-4 flex-row items-center gap-2">
              <ReceiptText size={20} color={theme.green900} />
              <Text className="text-lg font-bold text-ink-900">
                Récapitulatif serveur
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-ink-600">
                {item.nights} × {formatPrix(item.pricePerNightSnapshotFcfa)}
              </Text>
              <Text className="font-semibold text-ink-800">
                {formatPrix(item.subtotalFcfa)}
              </Text>
            </View>
            <View className="my-4 border-t border-ink-100" />
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-ink-600">Total</Text>
              <Text className="text-xl font-extrabold text-brand-800">
                {formatPrix(item.totalFcfa)}
              </Text>
            </View>
          </View>

          {item.confirmedAt ? (
            <View className="mt-4 rounded-2xl bg-green-50 p-4">
              <Text className="font-bold text-green-900">
                Confirmée le {formatServerDateTime(item.confirmedAt)}
              </Text>
            </View>
          ) : null}

          {item.cancelledAt ? (
            <View className="mt-4 rounded-2xl bg-red-50 p-4">
              <Text className="font-bold text-red-900">
                {cancellationSourceLabel(item.cancellationSource)}
              </Text>
              <Text className="mt-1 text-sm text-red-800">
                {formatServerDateTime(item.cancelledAt)}
              </Text>
              {item.cancellationReason ? (
                <Text className="mt-2 text-sm leading-5 text-red-800">
                  {item.cancellationReason}
                </Text>
              ) : null}
            </View>
          ) : null}

          {item.status === "en_attente_paiement" ? (
            <Button
              onPress={pay}
              disabled={retryPayment.isPending}
              className="mt-5"
            >
              {retryPayment.isPending ? (
                <ActivityIndicator color="white" />
              ) : (
                <ButtonText>Reprendre le paiement</ButtonText>
              )}
            </Button>
          ) : null}
          {item.status !== "annulee" && item.temporalStatus === "a_venir" ? (
            <Button
              variant="outline"
              static
              onPress={confirmCancel}
              disabled={cancel.isPending}
              className="mt-3"
            >
              {cancel.isPending ? (
                <ActivityIndicator color={theme.green900} />
              ) : (
                <ButtonText className="text-brand-800">
                  Annuler la réservation
                </ButtonText>
              )}
            </Button>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
