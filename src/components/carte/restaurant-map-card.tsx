import { formatPrix } from "@/lib/format";
import type { Restaurant } from "@/types";
import { Image } from "expo-image";
import { Clock, MapPin, Star, UtensilsCrossed, X } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

interface RestaurantMapCardProps {
  restaurant: Restaurant;
  onPress: (restaurant: Restaurant) => void;
  onClose?: () => void;
  onItineraire?: (restaurant: Restaurant) => void;
  compact?: boolean;
}

export function RestaurantMapCard({
  restaurant,
  onPress,
  onClose,
  onItineraire,
  compact = false,
}: RestaurantMapCardProps) {
  const disponible = restaurant.enLigne && restaurant.accepteCommandes;
  const attente =
    restaurant.tempsAttente?.label ??
    (restaurant.tempsPreparationMoyen
      ? `~${restaurant.tempsPreparationMoyen} min`
      : null);

  return (
    <Pressable
      onPress={() => onPress(restaurant)}
      accessibilityRole="button"
      accessibilityLabel={`Voir ${restaurant.nom}`}
      className={`overflow-hidden rounded-3xl border border-ink-100 bg-white ${compact ? "p-3" : "p-4"
        }`}
      style={{ borderCurve: "continuous", boxShadow: "0 8px 24px rgba(17, 24, 39, 0.14)" }}
    >
      <View className="flex-row gap-3">
        <View
          className={`overflow-hidden rounded-2xl bg-brand-50 ${compact ? "h-20 w-20" : "h-24 w-24"
            }`}
          style={{ borderCurve: "continuous" }}
        >
          {restaurant.logoUrl || restaurant.banniereUrl ? (
            <Image
              source={restaurant.logoUrl ?? restaurant.banniereUrl}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <UtensilsCrossed size={40} color="#14532d" />
            </View>
          )}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 text-base font-extrabold text-ink-900"
              numberOfLines={1}
            >
              {restaurant.nom}
            </Text>
            {onClose && (
              <Pressable
                onPress={(event) => {
                  event.stopPropagation();
                  onClose();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Fermer la fiche"
                className="h-7 w-7 items-center justify-center rounded-full bg-ink-100"
              >
                <X size={16} color="#6B7280" />
              </Pressable>
            )}
          </View>

          <Text
            className={`self-start rounded-full px-2 py-0.5 text-xs font-semibold ${disponible
              ? "bg-brand-50 text-brand-800"
              : "bg-ink-100 text-ink-500"
              }`}
          >
            {disponible ? "Ouvert aux commandes" : "Indisponible"}
          </Text>

          {Array.isArray(restaurant.cuisines) &&
            restaurant.cuisines.length > 0 && (
              <Text className="text-xs text-ink-500" numberOfLines={1}>
                {restaurant.cuisines.join(" · ")}
              </Text>
            )}

          <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {typeof restaurant.distanceKm === "number" && (
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color="#6B7280" />
                <Text className="text-xs text-ink-600">
                  {restaurant.distanceKm.toFixed(1)} km
                </Text>
              </View>
            )}
            {attente && (
              <View className="flex-row items-center gap-1">
                <Clock size={13} color="#6B7280" />
                <Text className="text-xs text-ink-600">{attente}</Text>
              </View>
            )}
            {restaurant.nombreAvis > 0 &&
              typeof restaurant.noteMoyenne === "number" && (
                <View className="flex-row items-center gap-1">
                  <Star size={13} color="#CA8A04" />
                  <Text className="text-xs text-ink-600">
                    {restaurant.noteMoyenne.toFixed(1)}
                  </Text>
                </View>
              )}
          </View>

          {!compact && (
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-brand-800">
                Livraison {formatPrix(restaurant.fraisLivraison)}
              </Text>
              {onItineraire && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onItineraire(restaurant);
                  }}
                  className="rounded-full bg-brand-50 px-3 py-1.5 flex-row items-center"
                >
                  <MapPin size={14} color="#14532d" />
                  <Text className="ml-1 text-xs font-bold text-brand-800">Y aller</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}
