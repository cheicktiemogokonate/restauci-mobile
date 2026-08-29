import { ResidenceCard } from "@/components/residences/ResidenceCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { Input } from "@/components/ui/input";
import { Text as ButtonText } from "@/components/ui/text";
import { useClientReservations, useResidenceSearch } from "@/hooks/useResidences";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { BedDouble, CalendarDays, MapPin, Search } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ResidencesScreen() {
  const router = useRouter();
  const client = useStore((state) => state.client);
  const [section, setSection] = useState<"explore" | "trips">("explore");
  const [destination, setDestination] = useState("");
  const residences = useResidenceSearch(destination);
  const reservations = useClientReservations();
  const showingTrips = section === "trips";

  return (
    <SafeAreaView className="flex-1 bg-ink-50" edges={["top"]}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-3xl font-extrabold text-ink-900">Résidences</Text>
        <Text className="mt-1 text-sm text-ink-500">Trouvez et réservez votre prochain séjour.</Text>
        <View className="mt-5 flex-row rounded-full bg-white p-1 border border-ink-100">
          {(["explore", "trips"] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setSection(value)}
              className={`flex-1 items-center rounded-full py-3 ${section === value ? "bg-brand-900" : "bg-transparent"}`}
            >
              <Text className={`font-bold ${section === value ? "text-white" : "text-ink-500"}`}>
                {value === "explore" ? "Explorer" : "Mes séjours"}
              </Text>
            </Pressable>
          ))}
        </View>
        {!showingTrips ? (
          <View className="mt-4 flex-row items-center rounded-2xl border border-ink-200 bg-white px-4">
            <Search size={19} color="#6b7280" />
            <Input
              value={destination}
              onChangeText={setDestination}
              placeholder="Ville ou destination"
              className="h-14 flex-1 border-0 bg-transparent shadow-none"
              returnKeyType="search"
            />
          </View>
        ) : null}
      </View>

      {showingTrips ? (
        !client ? (
          <View className="flex-1 items-center justify-center px-8 pb-28">
            <CalendarDays size={44} color="#14532d" />
            <Text className="mt-4 text-xl font-bold text-ink-900">Retrouvez vos séjours</Text>
            <Text className="mb-6 mt-2 text-center text-ink-500">Connectez-vous pour suivre vos réservations et reprendre un paiement.</Text>
            <Button onPress={() => router.push({ pathname: "/auth/login", params: { redirectTo: "/(tabs)/residences" } })} className="px-8">
              <ButtonText>Se connecter</ButtonText>
            </Button>
          </View>
        ) : reservations.isPending ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#14532d" /></View>
        ) : reservations.isError ? (
          <ErrorView message={reservations.error.message} onRetry={() => void reservations.refetch()} />
        ) : (
          <FlatList
            data={reservations.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 20, paddingBottom: 130, gap: 12, flexGrow: 1 }}
            ListEmptyComponent={<EmptyState emoji="🧳" title="Aucun séjour" message="Vos futures réservations apparaîtront ici." />}
            renderItem={({ item }) => (
              <Pressable onPress={() => router.push(`/reservations/${item.id}`)} className="flex-row overflow-hidden rounded-2xl border border-ink-100 bg-white p-3 active:opacity-90">
                <View className="h-24 w-24 overflow-hidden rounded-xl bg-ink-100">
                  {item.residenceCoverUrl ? <Image source={{ uri: item.residenceCoverUrl }} contentFit="cover" style={{ width: "100%", height: "100%" }} /> : <View className="flex-1 items-center justify-center"><BedDouble color="#14532d" /></View>}
                </View>
                <View className="ml-3 flex-1 justify-center">
                  <Text className="font-bold text-ink-900" numberOfLines={1}>{item.residenceTitle}</Text>
                  <View className="mt-1 flex-row items-center gap-1"><MapPin size={13} color="#6b7280" /><Text className="text-xs text-ink-500">{item.residenceCity}</Text></View>
                  <Text className="mt-2 text-xs text-ink-600">{item.checkIn} → {item.checkOut}</Text>
                  <View className="mt-2 flex-row items-center justify-between"><Text className="text-sm font-bold text-brand-800">{formatPrix(item.totalFcfa)}</Text><Text className="text-xs font-semibold text-ink-500">{item.status === "confirmee" ? "Confirmée" : item.status === "annulee" ? "Annulée" : "Paiement attendu"}</Text></View>
                </View>
              </Pressable>
            )}
          />
        )
      ) : residences.isPending ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#14532d" /></View>
      ) : residences.isError ? (
        <ErrorView message={residences.error.message} onRetry={() => void residences.refetch()} />
      ) : (
        <FlatList
          data={residences.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 130, gap: 16, flexGrow: 1 }}
          ListEmptyComponent={<EmptyState emoji="🏡" title="Aucune résidence trouvée" message="Essayez une autre destination." />}
          renderItem={({ item }) => <ResidenceCard residence={item} />}
        />
      )}
    </SafeAreaView>
  );
}
