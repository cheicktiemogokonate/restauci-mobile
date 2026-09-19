import { ResidenceCard } from "@/components/residences/ResidenceCard";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { Input } from "@/components/ui/input";
import { Text as ButtonText } from "@/components/ui/text";
import {
  addResidenceDays,
  formatResidenceDate,
  getDefaultResidenceStay,
  type ResidenceStaySelection,
} from "@/domain/residenceSearch";
import {
  useClientReservations,
  useResidenceSearch,
} from "@/hooks/useResidences";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  BedDouble,
  CalendarDays,
  MapPin,
  Minus,
  Plus,
  Search,
  Users,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const temporalLabels = {
  a_venir: "À venir",
  en_cours: "En cours",
  terminee: "Terminée",
} as const;

function StepButton({
  label,
  onPress,
  variant = "light",
}: {
  label: string;
  onPress: () => void;
  variant?: "light" | "dark";
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`h-9 w-9 items-center justify-center rounded-full ${variant === "dark" ? "bg-brand-900" : "bg-ink-100"}`}
    >
      {variant === "dark" ? (
        <Plus size={16} color="white" />
      ) : (
        <Minus size={16} color="theme.green900" />
      )}
    </Pressable>
  );
}

export default function ResidencesScreen() {
  const router = useRouter();
  const client = useStore((state) => state.client);
  const [section, setSection] = useState<"explore" | "trips">("explore");
  const [destination, setDestination] = useState("");
  const [stay, setStay] = useState<ResidenceStaySelection>(
    getDefaultResidenceStay,
  );
  const residences = useResidenceSearch({ destination, ...stay });
  const reservations = useClientReservations();
  const showingTrips = section === "trips";

  const changeCheckIn = (days: number) => {
    setStay((current) => {
      const nextCheckIn = addResidenceDays(current.checkIn, days);
      const minimumCheckIn = getDefaultResidenceStay().checkIn;
      if (nextCheckIn < minimumCheckIn) return current;
      return {
        ...current,
        checkIn: nextCheckIn,
        checkOut:
          current.checkOut <= nextCheckIn
            ? addResidenceDays(nextCheckIn, 1)
            : current.checkOut,
      };
    });
  };

  const changeCheckOut = (days: number) => {
    setStay((current) => {
      const nextCheckOut = addResidenceDays(current.checkOut, days);
      return nextCheckOut <= current.checkIn
        ? current
        : { ...current, checkOut: nextCheckOut };
    });
  };

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <View className="px-5 pb-3 pt-2">
        <Text className="text-3xl font-extrabold text-ink-900">
          Résidences
        </Text>
        <Text className="mt-1 text-sm text-ink-500">
          Trouvez et réservez votre prochain séjour.
        </Text>
        <View className="mt-5 flex-row rounded-full border border-ink-100 bg-white p-1">
          {(["explore", "trips"] as const).map((value) => (
            <Pressable
              key={value}
              onPress={() => setSection(value)}
              className={`flex-1 items-center rounded-full py-3 ${section === value ? "bg-brand-900" : "bg-transparent"}`}
            >
              <Text
                className={`font-bold ${section === value ? "text-white" : "text-ink-500"}`}
              >
                {value === "explore" ? "Explorer" : "Mes séjours"}
              </Text>
            </Pressable>
          ))}
        </View>

        {!showingTrips ? (
          <View className="mt-4 gap-3">
            <View className="flex-row items-center rounded-2xl border border-ink-200 bg-white px-4">
              <Search size={19} color="theme.ink500" />
              <Input
                value={destination}
                onChangeText={setDestination}
                placeholder="Ville ou destination"
                className="h-14 flex-1 border-0 bg-transparent shadow-none"
                returnKeyType="search"
              />
            </View>
            <View className="rounded-2xl border border-ink-200 bg-white p-3">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase text-ink-400">
                    Arrivée
                  </Text>
                  <Text className="mt-1 font-bold text-ink-900">
                    {formatResidenceDate(stay.checkIn)}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <StepButton
                    label="Reculer la date d'arrivée"
                    onPress={() => changeCheckIn(-1)}
                  />
                  <StepButton
                    label="Avancer la date d'arrivée"
                    onPress={() => changeCheckIn(1)}
                    variant="dark"
                  />
                </View>
              </View>
              <View className="my-3 border-t border-ink-100" />
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xs font-semibold uppercase text-ink-400">
                    Départ
                  </Text>
                  <Text className="mt-1 font-bold text-ink-900">
                    {formatResidenceDate(stay.checkOut)}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <StepButton
                    label="Reculer la date de départ"
                    onPress={() => changeCheckOut(-1)}
                  />
                  <StepButton
                    label="Avancer la date de départ"
                    onPress={() => changeCheckOut(1)}
                    variant="dark"
                  />
                </View>
              </View>
              <View className="my-3 border-t border-ink-100" />
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Users size={18} color="theme.green900" />
                  <Text className="font-bold text-ink-900">
                    {stay.guests} voyageur{stay.guests > 1 ? "s" : ""}
                  </Text>
                </View>
                <View className="flex-row gap-2">
                  <StepButton
                    label="Retirer un voyageur"
                    onPress={() =>
                      setStay((current) => ({
                        ...current,
                        guests: Math.max(1, current.guests - 1),
                      }))
                    }
                  />
                  <StepButton
                    label="Ajouter un voyageur"
                    onPress={() =>
                      setStay((current) => ({
                        ...current,
                        guests: Math.min(100, current.guests + 1),
                      }))
                    }
                    variant="dark"
                  />
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </View>

      {showingTrips ? (
        !client ? (
          <View className="flex-1 items-center justify-center px-8 pb-28">
            <CalendarDays size={44} color="theme.green900" />
            <Text className="mt-4 text-xl font-bold text-ink-900">
              Retrouvez vos séjours
            </Text>
            <Text className="mb-6 mt-2 text-center text-ink-500">
              Connectez-vous pour suivre vos réservations et reprendre un
              paiement.
            </Text>
            <Button
              onPress={() =>
                router.push({
                  pathname: "/auth/login",
                  params: { redirectTo: "/(tabs)/residences" },
                })
              }
              className="px-8"
            >
              <ButtonText>Se connecter</ButtonText>
            </Button>
          </View>
        ) : reservations.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="theme.green900" />
          </View>
        ) : reservations.isError ? (
          <ErrorView
            message={reservations.error.message}
            onRetry={() => void reservations.refetch()}
          />
        ) : (
          <FlatList
            data={reservations.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 130,
              gap: 12,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <EmptyState
                emoji="🧳"
                title="Aucun séjour"
                message="Vos futures réservations apparaîtront ici."
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => router.push(`/reservations/${item.id}`)}
                className="flex-row overflow-hidden rounded-2xl border border-ink-100 bg-white p-3 active:opacity-90"
              >
                <View className="h-24 w-24 overflow-hidden rounded-xl bg-ink-100">
                  {item.residenceCoverUrl ? (
                    <Image
                      source={{ uri: item.residenceCoverUrl }}
                      contentFit="cover"
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <View className="flex-1 items-center justify-center">
                      <BedDouble color="theme.green900" />
                    </View>
                  )}
                </View>
                <View className="ml-3 flex-1 justify-center">
                  <Text
                    className="font-bold text-ink-900"
                    numberOfLines={1}
                  >
                    {item.residenceTitle}
                  </Text>
                  <View className="mt-1 flex-row items-center gap-1">
                    <MapPin size={13} color="theme.ink500" />
                    <Text className="text-xs text-ink-500">
                      {item.residenceCity}
                    </Text>
                  </View>
                  <Text className="mt-2 text-xs text-ink-600">
                    {formatResidenceDate(item.checkIn)} → {" "}
                    {formatResidenceDate(item.checkOut)}
                  </Text>
                  <View className="mt-2 flex-row items-center justify-between">
                    <Text className="text-sm font-bold text-brand-800">
                      {formatPrix(item.totalFcfa)}
                    </Text>
                    <Text className="text-xs font-semibold text-ink-500">
                      {item.status === "confirmee"
                        ? temporalLabels[item.temporalStatus]
                        : item.status === "annulee"
                          ? "Annulée"
                          : "Paiement attendu"}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
          />
        )
      ) : residences.isPending ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="theme.green900" />
        </View>
      ) : residences.isError ? (
        <ErrorView
          message={residences.error.message}
          onRetry={() => void residences.refetch()}
        />
      ) : (
        <FlatList
          data={residences.data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 130,
            gap: 16,
            flexGrow: 1,
          }}
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (residences.hasNextPage && !residences.isFetchingNextPage) {
              void residences.fetchNextPage();
            }
          }}
          ListFooterComponent={
            residences.isFetchingNextPage ? (
              <ActivityIndicator color="theme.green900" />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              emoji="🏡"
              title="Aucune résidence disponible"
              message="Modifiez la destination, les dates ou le nombre de voyageurs."
            />
          }
          renderItem={({ item }) => (
            <ResidenceCard residence={item} stay={stay} />
          )}
        />
      )}
    </SafeAreaView>
  );
}
