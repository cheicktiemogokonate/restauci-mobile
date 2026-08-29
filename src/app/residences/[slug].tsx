import { Button } from "@/components/ui/button";
import { ErrorView } from "@/components/ui/ErrorView";
import { Text as ButtonText } from "@/components/ui/text";
import { useCreateResidenceReservation, useResidence, useResidenceQuote } from "@/hooks/useResidences";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import type { ResidencePaymentMethod } from "@/types/residences";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { BedDouble, CalendarDays, ChevronLeft, MapPin, Minus, Plus, ShieldCheck, Users } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function initialDate(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

function formatStayDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00.000Z`));
}

export default function ResidenceDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const client = useStore((state) => state.client);
  const residence = useResidence(slug ?? null);
  const [checkIn, setCheckIn] = useState(() => initialDate(1));
  const [checkOut, setCheckOut] = useState(() => initialDate(2));
  const [guests, setGuests] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<ResidencePaymentMethod>("mobile_money");
  const quote = useResidenceQuote({ residenceId: residence.data?.id ?? null, checkIn, checkOut, guests });
  const createReservation = useCreateResidenceReservation();
  const cover = residence.data?.photos[0]?.url;
  const canBook = Boolean(residence.data?.bookability.isBookable && quote.data?.available && !createReservation.isPending);

  const nightsLabel = useMemo(() => quote.data ? `${quote.data.nights} nuit${quote.data.nights > 1 ? "s" : ""}` : "Calcul en cours", [quote.data]);

  const submit = () => {
    if (!residence.data) return;
    if (!client) {
      router.push({ pathname: "/auth/login", params: { redirectTo: `/residences/${residence.data.slug}` } });
      return;
    }
    if (!canBook) {
      Alert.alert("Séjour indisponible", "Vérifiez vos dates ou choisissez une autre résidence.");
      return;
    }
    createReservation.mutate({
      residenceId: residence.data.id,
      checkIn,
      checkOut,
      guests,
      paymentMethod,
      discoveryToken: residence.data.discoveryToken || undefined,
    }, {
      onSuccess: (result) => {
        void Linking.openURL(result.checkoutUrl).catch(() => {
          Alert.alert("Paiement à reprendre", "La réservation est enregistrée. Reprenez le paiement depuis Mes séjours.");
          router.replace(`/reservations/${result.reservationId}`);
        });
      },
      onError: (error) => Alert.alert("Réservation impossible", error.message),
    });
  };

  if (residence.isPending) return <SafeAreaView className="flex-1 items-center justify-center bg-white"><ActivityIndicator size="large" color="#14532d" /></SafeAreaView>;
  if (residence.isError || !residence.data) return <SafeAreaView className="flex-1 bg-white"><ErrorView message={residence.error?.message ?? "Résidence introuvable"} onRetry={() => void residence.refetch()} /></SafeAreaView>;

  const item = residence.data;
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
        <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="h-72 bg-ink-100">
            {cover ? <Image source={{ uri: cover }} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : <View className="flex-1 items-center justify-center"><Text className="text-7xl">🏠</Text></View>}
            <Pressable onPress={() => router.back()} className="absolute left-4 top-4 h-11 w-11 items-center justify-center rounded-full bg-white/95"><ChevronLeft size={25} color="#111827" /></Pressable>
          </View>
          <View className="px-5 pt-5">
            <Text className="text-3xl font-extrabold text-ink-900">{item.title}</Text>
            <View className="mt-2 flex-row items-center gap-2"><MapPin size={17} color="#6b7280" /><Text className="text-ink-500">{item.city}, {item.country}</Text></View>
            <View className="mt-5 flex-row items-center gap-5 rounded-2xl bg-ink-50 p-4">
              <View className="flex-row items-center gap-2"><Users size={19} color="#14532d" /><Text className="font-semibold text-ink-700">{item.maxGuests} voyageurs</Text></View>
              <View className="flex-row items-center gap-2"><BedDouble size={19} color="#14532d" /><Text className="font-semibold text-ink-700">Résidence entière</Text></View>
            </View>
            <Text className="mt-6 text-lg font-bold text-ink-900">À propos</Text>
            <Text className="mt-2 leading-6 text-ink-600">{item.description}</Text>

            <Text className="mt-7 text-lg font-bold text-ink-900">Votre séjour</Text>
            <View className="mt-3 gap-3">
              {([
                ["Arrivée", checkIn, (delta: number) => {
                  const next = addDays(checkIn, delta);
                  if (next < initialDate(1)) return;
                  setCheckIn(next);
                  if (checkOut <= next) setCheckOut(addDays(next, 1));
                }],
                ["Départ", checkOut, (delta: number) => {
                  const next = addDays(checkOut, delta);
                  if (next <= checkIn) return;
                  setCheckOut(next);
                }],
              ] as const).map(([label, value, change]) => (
                <View key={label} className="flex-row items-center justify-between rounded-2xl border border-ink-200 p-4">
                  <View className="flex-row items-center gap-3"><CalendarDays size={20} color="#14532d" /><View><Text className="text-xs font-semibold uppercase text-ink-400">{label}</Text><Text className="mt-1 font-bold text-ink-900">{formatStayDate(value)}</Text></View></View>
                  <View className="flex-row gap-2"><Pressable onPress={() => change(-1)} className="h-10 w-10 items-center justify-center rounded-full bg-ink-100"><Minus size={17} color="#14532d" /></Pressable><Pressable onPress={() => change(1)} className="h-10 w-10 items-center justify-center rounded-full bg-brand-900"><Plus size={17} color="white" /></Pressable></View>
                </View>
              ))}
              <View className="flex-row items-center justify-between rounded-2xl border border-ink-200 p-4">
                <View><Text className="text-xs font-semibold uppercase text-ink-400">Voyageurs</Text><Text className="mt-1 font-bold text-ink-900">{guests} voyageur{guests > 1 ? "s" : ""}</Text></View>
                <View className="flex-row gap-2"><Pressable onPress={() => setGuests((value) => Math.max(1, value - 1))} className="h-10 w-10 items-center justify-center rounded-full bg-ink-100"><Minus size={17} color="#14532d" /></Pressable><Pressable onPress={() => setGuests((value) => Math.min(item.maxGuests, value + 1))} className="h-10 w-10 items-center justify-center rounded-full bg-brand-900"><Plus size={17} color="white" /></Pressable></View>
              </View>
            </View>

            <Text className="mt-7 text-lg font-bold text-ink-900">Paiement sécurisé</Text>
            <View className="mt-3 flex-row gap-3">
              {(["mobile_money", "card"] as const).map((method) => <Pressable key={method} onPress={() => setPaymentMethod(method)} className={`flex-1 rounded-2xl border p-4 ${paymentMethod === method ? "border-brand-700 bg-brand-50" : "border-ink-200"}`}><ShieldCheck size={20} color="#14532d" /><Text className="mt-2 font-bold text-ink-900">{method === "mobile_money" ? "Mobile money" : "Carte bancaire"}</Text><Text className="mt-1 text-xs text-ink-500">via Paystack</Text></Pressable>)}
            </View>
          </View>
        </ScrollView>

        <View className="absolute bottom-0 left-0 right-0 border-t border-ink-100 bg-white px-5 pb-8 pt-4">
          <View className="mb-3 flex-row items-end justify-between"><View><Text className="text-xl font-extrabold text-brand-800">{quote.data ? formatPrix(quote.data.totalFcfa) : formatPrix(item.pricePerNightFcfa)}</Text><Text className="text-xs text-ink-500">{nightsLabel}</Text></View>{quote.isFetching ? <ActivityIndicator color="#14532d" /> : quote.data && !quote.data.available ? <Text className="font-semibold text-red-600">Dates indisponibles</Text> : null}</View>
          <Button onPress={submit} disabled={!canBook && Boolean(client) || createReservation.isPending}>
            {createReservation.isPending ? <ActivityIndicator color="white" /> : <ButtonText>{client ? "Réserver et payer" : "Se connecter pour réserver"}</ButtonText>}
          </Button>
        </View>
      </SafeAreaView>
    </>
  );
}
