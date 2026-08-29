import { getRestaurantWebUrl } from "@/constants/urls";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import type { ModeCommande, Plat, Restaurant } from "@/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Bike,
  ChevronLeft,
  ChevronRight,
  Clock,
  EllipsisVertical,
  Heart,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShoppingBag,
  Star,
  Store,
  Utensils,
  UtensilsCrossed
} from "lucide-react-native";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Share as NativeShare,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";


interface HeaderRestaurantProps {
  restaurant: Restaurant;
  onItineraire?: () => void;
  onVoirMenu?: () => void;
  popularPlats?: Plat[];
}

const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

const MODE_LABELS: Record<ModeCommande, string> = {
  sur_place: "Sur place",
  livraison: "Livraison",
  emporter: "À emporter",
};

// Une URL de dev ne doit jamais être montrée à l'utilisateur

export const HeaderRestaurant: React.FC<HeaderRestaurantProps> = ({
  restaurant,
  onItineraire,
  onVoirMenu,
  popularPlats = [],
}) => {
  const [selectedMode, setSelectedMode] = useState<ModeCommande | null>(
    restaurant.modesCommande[0] ?? null,
  );

  const aDesAvis = (restaurant.nombreAvis ?? 0) > 0;
  const router = useRouter();
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const favorites = useStore((s) => s.favorites);

  const isRestaurantFavorite = favorites.some(
    (favorite) =>
      favorite.id === restaurant.id || favorite.slug === restaurant.slug,
  );

  const [isFavPending, setIsFavPending] = useState(false);
  const effectiveSelectedMode =
    selectedMode && restaurant.modesCommande.includes(selectedMode)
      ? selectedMode
      : restaurant.modesCommande[0] ?? null;

  const handleToggleFavorite = useCallback(async () => {
    if (isFavPending) return;
    setIsFavPending(true);
    try {
      await toggleFavorite({
        id: restaurant.id,
        nom: restaurant.nom,
        slug: restaurant.slug,
        logoUrl: restaurant.logoUrl,
        banniereUrl: restaurant.banniereUrl,
      });
    } catch {
      Alert.alert(
        "Favori non enregistré",
        "Impossible d’enregistrer ce favori sur l’appareil.",
      );
    } finally {
      setIsFavPending(false);
    }
  }, [isFavPending, toggleFavorite, restaurant]);

  const handleShare = async () => {
    const url = getRestaurantWebUrl(restaurant.slug);
    const title = `Découvrir ${restaurant.nom} sur ToutCi`;
    const message = `Découvrez ${restaurant.nom} sur ToutCi.`;

    try {
      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({ title, text: message, url });
          return;
        }

        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(url);
          Alert.alert("Lien copié", "Le lien du restaurant a été copié.");
          return;
        }

        Alert.alert("Lien du restaurant", url);
        return;
      }

      await NativeShare.share(
        Platform.OS === "ios"
          ? { title, message, url }
          : { title, message: `${message}\n${url}` },
        {
          dialogTitle: `Partager ${restaurant.nom}`,
          subject: title,
        },
      );
    } catch (error) {
      if (
        Platform.OS === "web" &&
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      Alert.alert(
        "Partage impossible",
        "Le lien du restaurant n’a pas pu être partagé.",
      );
    }
  };

  const handlePhonePress = async () => {
    if (!restaurant.telephone) return;
    try {
      await Linking.openURL(`tel:${restaurant.telephone}`);
    } catch {
      Alert.alert(
        "Impossible d'appeler",
        "Cet appareil (ou simulateur) ne supporte pas les appels téléphoniques."
      );
    }
  };

  const handleEmailPress = async () => {
    if (!restaurant.email) return;
    try {
      await Linking.openURL(`mailto:${restaurant.email}`);
    } catch {
      Alert.alert(
        "Impossible d'envoyer un email",
        "Aucune application mail n'est configurée sur cet appareil."
      );
    }
  };

  const handleWebsitePress = async () => {
    if (!restaurant.siteWeb) return;
    const url = /^https?:\/\//i.test(restaurant.siteWeb)
      ? restaurant.siteWeb
      : `https://${restaurant.siteWeb}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Site indisponible",
        "Le site de cet établissement n’a pas pu être ouvert.",
      );
    }
  };

  return (
    <>
      <StatusBar barStyle="default" />
      <View>
        <View className="w-full relative">
          {restaurant.banniereUrl ? (
            <Image
              source={restaurant.banniereUrl}
              style={{ width: "100%", height: 350 }}
              placeholder={{ blurhash: BLUR_HASH }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Image
              source={require("@/assets/images/default_hero_bg.jpg")}
              style={{ width: "100%", height: 350 }}
              placeholder={{ blurhash: BLUR_HASH }}
              contentFit="cover"
              transition={200}
            />
          )}
          <View className="absolute top-14 w-full flex-row justify-between px-4">
            <TouchableOpacity
              className="w-11 h-11 rounded-full bg-black/40 items-center justify-center"
              onPress={() => router.back()}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <ChevronLeft size={24} color="white" />
            </TouchableOpacity>
            <View className="flex-row">
              <TouchableOpacity
                className="w-11 h-11 rounded-full bg-black/40 items-center justify-center mr-3"
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <Heart
                  size={20}
                  color={isRestaurantFavorite ? "#ef4444" : "white"}
                  fill={isRestaurantFavorite ? "#ef4444" : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="w-11 h-11 rounded-full bg-black/40 items-center justify-center"
                onPress={handleShare}
                activeOpacity={0.7}
                accessibilityRole="button"
              >
                <EllipsisVertical size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="-mt-8 pt-6 px-4 bg-[#fafaf9] rounded-t-[32px]">
          <View className="flex-row items-start mb-6">
            <View className="w-[72px] h-[72px] rounded-full overflow-hidden bg-white border border-brand-500 mr-4">
              {restaurant.logoUrl ? (
                <Image
                  source={restaurant.logoUrl}
                  style={{ width: "100%", height: "100%" }}
                  placeholder={{ blurhash: BLUR_HASH }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View className="flex-1 justify-center items-center">
                  <UtensilsCrossed size={30} color="#14532d" />
                </View>
              )}
            </View>

            <View className="flex-1 pt-1">
              <Text className="text-[22px] font-bold text-ink-900 font-serif leading-tight">
                {restaurant.nom}
              </Text>

              <View className="flex-row items-center justify-between mt-1">
                {restaurant.cuisines && restaurant.cuisines.length > 0 && (
                  <Text className="text-sm text-ink-500 flex-1 mr-2" numberOfLines={1}>
                    {restaurant.cuisines.join(" · ")}
                  </Text>
                )}
              </View>

              {onItineraire && (
                <TouchableOpacity
                  className="flex-row items-center mt-2.5 self-start"
                  onPress={onItineraire}
                >
                  <MapPin size={16} color="#14532d" />
                  <Text className="text-sm text-[#14532d] ml-1 font-semibold">
                    Voir l&apos;itinéraire
                  </Text>
                  <ChevronRight size={16} color="#14532d" />
                </TouchableOpacity>
              )}

              {(!restaurant.accepteCommandes || !restaurant.enLigne) && (
                <View
                  className={`mt-3 self-start rounded-full px-3 py-1 ${!restaurant.accepteCommandes ? "bg-orange-100" : "bg-ink-100"
                    }`}
                >
                  <Text
                    className={`text-xs font-semibold ${!restaurant.accepteCommandes
                      ? "text-orange-700"
                      : "text-ink-500"
                      }`}
                  >
                    {!restaurant.accepteCommandes
                      ? "Actuellement complet"
                      : "Fermé"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {restaurant.modesCommande.length > 0 && (
            <View className="flex-row gap-1 overflow-hidden bg-transparent mb-6">
              {restaurant.modesCommande.map((mode, index) => {
                const isSelected = effectiveSelectedMode === mode;
                let Icon = Store;
                if (mode === "livraison") Icon = Bike;
                else if (mode === "emporter") Icon = ShoppingBag;
                else if (mode === "sur_place") Icon = Utensils;

                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setSelectedMode(mode)}
                    activeOpacity={0.8}
                    className={`flex-1 p-0 py-1.5 flex-row justify-center border border-brand-800 rounded-full items-center ${isSelected ? "bg-brand-50" : "bg-transparent border border-ink-200"
                      }`}
                  >
                    <Icon size={14} color={isSelected ? "#14532d" : "#374151"} />
                    <Text
                      className={`text-xs ml-1 ${isSelected
                        ? "text-brand-900 font-semibold"
                        : "text-ink-700 font-medium"
                        }`}
                    >
                      {MODE_LABELS[mode] ?? mode}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Stats Block */}
          <View className="flex-row items-center justify-between py-4 border-y border-ink-200 px-2">
            <View className="flex-1 items-center">
              <View className="flex-row items-center gap-2 justify-center">
                <MessageSquare size={18} color="#c2410c" strokeWidth={1.5} />
                <View className="flex-col items-center">
                  <Text className="text-sm font-semibold text-ink-900">
                    Avis
                  </Text>
                  <Text className="text-sm font-bold text-ink-900">
                    {aDesAvis ? restaurant.nombreAvis : "—"}
                  </Text>
                </View>
              </View>
            </View>
            <View className="w-[1px] h-8 bg-ink-200" />
            <View className="flex-1 items-center">
              <View className="flex-row items-center mb-1">
                <Star size={18} color="#c2410c" strokeWidth={1.5} />
                <Text className="text-sm font-semibold ml-2 text-ink-900">
                  Nouveau
                </Text>
              </View>
            </View>
            <View className="w-[1px] h-8 bg-ink-200" />
            <View className="flex-1 items-center">
              <View className="flex-row items-center mb-1">
                <Clock size={18} color="#c2410c" strokeWidth={1.5} />
                <Text className="text-sm font-semibold ml-2 text-ink-900">
                  {restaurant.tempsAttente?.label ??
                    (restaurant.tempsPreparationMoyen
                      ? `~${restaurant.tempsPreparationMoyen}m`
                      : "—")}
                </Text>
              </View>
            </View>
          </View>

          {restaurant.description && (
            <View className="mt-6">
              <Text className="text-[17px] font-bold text-ink-900 mb-2">
                À propos
              </Text>
              <Text className="text-[15px] text-ink-600 leading-6">
                {restaurant.description}
              </Text>
            </View>
          )}

          {(restaurant.telephone ||
            restaurant.email ||
            restaurant.siteWeb) && (
              <View className="mt-6">
                <Text className="text-[17px] font-bold text-ink-900 mb-3">
                  Contact
                </Text>
                <View className="border border-ink-200 rounded-xl overflow-hidden bg-transparent">
                  {restaurant.telephone && (
                    <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-ink-200"
                      onPress={handlePhonePress}
                    >
                      <View className="flex-row items-center">
                        <Phone size={18} color="#14532d" />
                        <Text className="text-[15px] text-ink-700 ml-3">
                          {restaurant.telephone}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                  {restaurant.email && (
                    <TouchableOpacity
                      className={`flex-row items-center justify-between p-4 ${restaurant.siteWeb ? "border-b border-ink-200" : ""}`}
                      onPress={handleEmailPress}
                    >
                      <View className="flex-row items-center">
                        <Mail size={18} color="#14532d" />
                        <Text className="text-[15px] text-ink-700 ml-3">
                          {restaurant.email}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                  {restaurant.siteWeb && (
                    <TouchableOpacity
                      className="flex-row items-center justify-between p-4"
                      onPress={handleWebsitePress}
                    >
                      <View className="flex-row items-center">
                        <Globe size={18} color="#14532d" />
                        <Text
                          className="ml-3 flex-1 text-[15px] text-ink-700"
                          numberOfLines={1}
                        >
                          {restaurant.siteWeb}
                        </Text>
                      </View>
                      <ChevronRight size={18} color="#9ca3af" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

          {popularPlats.length > 0 && (
            <View className="mt-6">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-[17px] font-bold text-ink-900">
                  Plats populaires
                </Text>
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={onVoirMenu}
                >
                  <Text className="text-sm text-[#c2410c] font-medium mr-1">
                    Voir tout
                  </Text>
                  <ChevronRight size={14} color="#c2410c" />
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-4 px-4"
                contentContainerStyle={{ paddingRight: 32 }}
              >
                {popularPlats.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    className="w-[200px] mr-4"
                    onPress={onVoirMenu ?? (() => { })}
                    activeOpacity={0.9}
                  >
                    {p.photoUrl ? (
                      <Image
                        source={p.photoUrl}
                        style={{ width: 200, height: 120, borderRadius: 16 }}
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-[200px] h-[120px] rounded-2xl bg-ink-100" />
                    )}
                    <Text
                      className="mt-3 text-[15px] text-ink-900 font-semibold"
                      numberOfLines={1}
                    >
                      {p.nom}
                    </Text>
                    <Text className="text-[15px] text-[#14532d] mt-1 font-semibold">
                      {formatPrix(p.prix)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </View>
    </>
  );
};

export default HeaderRestaurant;
