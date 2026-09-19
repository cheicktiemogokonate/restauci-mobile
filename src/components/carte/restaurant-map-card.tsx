import { getVerticalDefinition } from "@/constants/verticals";
import { formatPrix } from "@/lib/format";
import type { Restaurant } from "@/types";
import type { Etablissement } from "@/types/etablissement";
import { Image } from "expo-image";
import { Clock, Home, MapPin, Star, UtensilsCrossed, X } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

export interface RestaurantMapCardProps {
  restaurant?: Restaurant | null;
  etablissement?: Etablissement | null;
  onPress: (item: any) => void;
  onClose?: () => void;
  onItineraire?: (item: any) => void;
  onToggleFavorite?: (item: any) => void;
  isFavorite?: boolean;
  compact?: boolean;
}

export function RestaurantMapCard({
  restaurant,
  etablissement,
  onPress,
  onClose,
  onItineraire,
  compact = false,
}: RestaurantMapCardProps) {
  // Support polyvalent restaurant / établissement transversal
  const item = etablissement ?? restaurant;
  if (!item) return null;

  const isResidence =
    ("type" in item && item.type === "residence") ||
    ("category" in item && (item as any).category === "residence");

  const def = getVerticalDefinition(isResidence ? "residence" : "restaurant");

  const disponible =
    "accepteCommandes" in item
      ? Boolean(item.enLigne && item.accepteCommandes)
      : Boolean(item.enLigne);

  const attente =
    "tempsAttente" in item && item.tempsAttente?.label
      ? item.tempsAttente.label
      : "tempsPreparationMoyen" in item && item.tempsPreparationMoyen
        ? `~${item.tempsPreparationMoyen} min`
        : null;

  const itemTags: string[] | undefined =
    "tags" in item && Array.isArray(item.tags) ? item.tags : undefined;

  const detailTag = isResidence
    ? itemTags?.find(
        (t: string) =>
          t.includes("pers") || t.includes("voyageur") || t.includes("pièce"),
      ) ?? "Résidence entière"
    : attente ?? itemTags?.find((t: string) => t.includes("min")) ?? null;

  const cuisinesText =
    "cuisines" in item && Array.isArray(item.cuisines) && item.cuisines.length > 0
      ? item.cuisines.join(" · ")
      : isResidence
        ? def.formatSummary({
            adresse: item.adresse,
            tags: itemTags,
          })
        : null;

  const imageSource =
    ("imageUrl" in item && item.imageUrl) ||
    ("logoUrl" in item && item.logoUrl) ||
    ("banniereUrl" in item && item.banniereUrl) ||
    null;

  const priceText = isResidence
    ? def.formatPrice({
        prixAffiche: (item as any).prixAffiche,
        prixFcfa: (item as any).prixFcfa,
      })
    : "fraisLivraison" in item
      ? `Livraison ${formatPrix(item.fraisLivraison)}`
      : def.formatPrice({
          prixAffiche: (item as any).prixAffiche,
          prixFcfa: (item as any).prixFcfa,
        });

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`Voir ${item.nom}`}
      className={`overflow-hidden rounded-3xl border border-ink-100 bg-white ${
        compact ? "p-3" : "p-4"
      }`}
      style={{
        borderCurve: "continuous",
        boxShadow: "0 8px 24px rgba(17, 24, 39, 0.14)",
      }}
    >
      <View className="flex-row gap-3">
        <View
          className={`overflow-hidden rounded-2xl bg-brand-50 ${
            compact ? "h-20 w-20" : "h-24 w-24"
          }`}
          style={{ borderCurve: "continuous" }}
        >
          {imageSource ? (
            <Image
              source={typeof imageSource === "string" ? { uri: imageSource } : imageSource}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={150}
              accessibilityLabel={`Photo de ${item.nom}`}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              {isResidence ? (
                <Home size={compact ? 32 : 40} color={def.accentColor} />
              ) : (
                <UtensilsCrossed size={compact ? 32 : 40} color={def.accentColor} />
              )}
            </View>
          )}
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 text-base font-extrabold text-ink-900"
              numberOfLines={1}
            >
              {item.nom}
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
            className={`self-start rounded-full px-2 py-0.5 text-xs font-semibold ${
              disponible
                ? isResidence
                  ? "bg-orange-50 text-orange-800"
                  : "bg-brand-50 text-brand-800"
                : "bg-ink-100 text-ink-500"
            }`}
          >
            {disponible
              ? isResidence
                ? "Disponible à la réservation"
                : "Ouvert aux commandes"
              : "Indisponible"}
          </Text>

          {cuisinesText ? (
            <Text className="text-xs text-ink-500" numberOfLines={1}>
              {cuisinesText}
            </Text>
          ) : null}

          <View className="mt-1 flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {typeof item.distanceKm === "number" && (
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color="#6B7280" />
                <Text className="text-xs text-ink-600">
                  {item.distanceKm.toFixed(1)} km
                </Text>
              </View>
            )}
            {detailTag && (
              <View className="flex-row items-center gap-1">
                {isResidence ? (
                  <Home size={13} color="#6B7280" />
                ) : (
                  <Clock size={13} color="#6B7280" />
                )}
                <Text className="text-xs text-ink-600">{detailTag}</Text>
              </View>
            )}
            {(item.nombreAvis ?? 0) > 0 &&
              typeof item.noteMoyenne === "number" && (
                <View className="flex-row items-center gap-1">
                  <Star size={13} color="#CA8A04" />
                  <Text className="text-xs text-ink-600">
                    {item.noteMoyenne.toFixed(1)}
                  </Text>
                </View>
              )}
          </View>

          {!compact && (
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-sm font-bold text-brand-800">
                {priceText}
              </Text>
              {onItineraire && (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    onItineraire(item);
                  }}
                  className="rounded-full bg-brand-50 px-3 py-1.5 flex-row items-center"
                  accessibilityRole="button"
                  accessibilityLabel={`Itinéraire vers ${item.nom}`}
                >
                  <MapPin size={14} color="#14532d" />
                  <Text className="ml-1 text-xs font-bold text-brand-800">
                    Y aller
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export const EtablissementMapCard = RestaurantMapCard;
export type EtablissementMapCardProps = RestaurantMapCardProps;
