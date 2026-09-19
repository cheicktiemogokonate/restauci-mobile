import { Card, CardContent } from "@/components/ui/card";
import type { ResidenceStaySelection } from "@/domain/residenceSearch";
import { formatPrix } from "@/lib/format";
import type { PublicResidence } from "@/types/residences";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { MapPin, Sparkles, Users } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export function ResidenceCard({
  residence,
  stay,
}: {
  residence: PublicResidence;
  stay: ResidenceStaySelection;
}) {
  const router = useRouter();
  const cover = residence.photos[0]?.url;

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/residences/[slug]",
          params: {
            slug: residence.slug,
            checkIn: stay.checkIn,
            checkOut: stay.checkOut,
            guests: String(stay.guests),
            discoveryToken: residence.discoveryToken,
          },
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`Voir ${residence.title}`}
      className="active:opacity-90"
    >
      <Card className="overflow-hidden p-0 gap-0 bg-white">
        <View className="h-48 bg-ink-100">
          {cover ? (
            <Image source={{ uri: cover }} contentFit="cover" style={{ width: "100%", height: "100%" }} />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-5xl">🏠</Text>
            </View>
          )}
          {residence.placement === "promoted" ? (
            <View className="absolute left-3 top-3 flex-row items-center gap-1 rounded-full bg-white/95 px-3 py-1.5">
              <Sparkles size={13} color="theme.green900" />
              <Text className="text-xs font-bold text-brand-800">Recommandée</Text>
            </View>
          ) : null}
        </View>
        <CardContent className="px-4 py-4">
          <Text className="text-lg font-bold text-ink-900" numberOfLines={1}>{residence.title}</Text>
          <View className="mt-2 flex-row items-center gap-1.5">
            <MapPin size={15} color="theme.ink500" />
            <Text className="text-sm text-ink-500">{residence.city}, {residence.country}</Text>
          </View>
          <View className="mt-3 flex-row items-end justify-between">
            <View>
              <Text className="text-lg font-extrabold text-brand-800">{formatPrix(residence.pricePerNightFcfa)}</Text>
              <Text className="text-xs text-ink-500">par nuit</Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Users size={15} color="theme.ink500" />
              <Text className="text-sm text-ink-600">{residence.maxGuests} max.</Text>
            </View>
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
}
