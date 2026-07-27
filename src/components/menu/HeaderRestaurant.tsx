import { Card } from "@/components/ui/card";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import type { Plat, Restaurant } from "@/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ChevronLeft,
  Clock,
  Heart,
  MapPin,
  Share,
  Star,
} from "lucide-react-native";
import { useEffect } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";

interface HeaderRestaurantProps {
  restaurant: Restaurant;
  onItineraire?: () => void;
  onVoirMenu?: () => void;
  popularPlats?: Plat[];
}

const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

const MODE_LABELS: Record<string, string> = {
  sur_place: "Sur place",
  surplace: "Sur place",
  livraison: "Livraison",
  delivery: "Livraison",
  emporter: "À emporter",
  takeout: "À emporter",
};

// Une URL de dev ne doit jamais être montrée à l'utilisateur

export const HeaderRestaurant: React.FC<HeaderRestaurantProps> = ({
  restaurant,
  onItineraire,
  onVoirMenu,
  popularPlats = [],
}) => {
  const aDesAvis = (restaurant.nombreAvis ?? 0) > 0;
  const router = useRouter();
  const loadFavorites = useStore((s) => s.loadFavorites);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const isFavorite = useStore((s) => s.isFavorite);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const isRestaurantFavorite = isFavorite(restaurant.id);

  const handleToggleFavorite = async () => {
    await toggleFavorite({
      id: restaurant.id,
      nom: restaurant.nom,
      slug: restaurant.slug,
      logoUrl: restaurant.logoUrl,
      banniereUrl: restaurant.banniereUrl,
    });
  };

  return (
    <>
      {/* <StatusBar hidden={true} /> */}
      <View>
        <View className="w-full relative">
          {restaurant.banniereUrl ? (
            <Image
              source={restaurant.banniereUrl}
              style={{ width: "100%", height: 300 }}
              placeholder={{ blurhash: BLUR_HASH }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <Image
              source={require("@/assets/images/default_hero_bg.jpg")}
              style={{ width: "100%", height: 300, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" }}
              placeholder={{ blurhash: BLUR_HASH }}
              contentFit="cover"
              transition={200}
            />
          )}
          <View className="absolute top-14 w-full flex-row justify-between mt-3">
            <TouchableOpacity
              className="flex-row justify-center items-center px-4 py-3 bg-white shadow-md shadow-black/10 w-14 h-14 rounded-full ml-3"
              onPress={() => {
                router.back();
              }}
              activeOpacity={0.7}
            >
              <ChevronLeft size={28} color="black" />
            </TouchableOpacity>
            <View className="flex-row justify-center items-center">
              <TouchableOpacity
                className="flex-row justify-between items-center px-4 py-3 bg-white shadow-md shadow-black/10 w-14 h-14 rounded-full mr-3"
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
              >
                <Heart
                  size={24}
                  color={isRestaurantFavorite ? "#ef4444" : "black"}
                  fill={isRestaurantFavorite ? "#ef4444" : "none"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-row justify-between items-center px-4 py-3 bg-white shadow-md shadow-black/10 w-14 h-14 rounded-full mr-3"
                onPress={() => {}}
                activeOpacity={0.7}
              >
                <Share size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Card className="mx-4 -mt-10 p-4 bg-ink-50 border-ink-200">
          <View className="flex-row items-center">
            <View className="w-14 h-14 rounded-full overflow-hidden bg-ink-100 mr-3">
              {restaurant.logoUrl ? (
                <Image
                  source={restaurant.logoUrl}
                  style={{ width: "100%", height: "100%", borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" }}
                  placeholder={{ blurhash: BLUR_HASH }}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-2xl">🍽</Text>
                </View>
              )}
            </View>

            <View className="flex-1 mr-2">
              <Text className="text-lg font-bold text-ink-900">
                {restaurant.nom}
              </Text>

              {/* Cuisines : décision rapide */}
              {restaurant.cuisines?.length > 0 && (
                <Text className="text-sm text-ink-500 mt-1" numberOfLines={1}>
                  {restaurant.cuisines.join(" · ")}
                </Text>
              )}

              {(!restaurant.accepteCommandes || !restaurant.enLigne) && (
                <View
                  className={`mt-2 self-start rounded-full px-3 py-1 ${
                    !restaurant.accepteCommandes
                      ? "bg-orange-100"
                      : "bg-ink-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      !restaurant.accepteCommandes
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

            {onItineraire && (
              <TouchableOpacity
                className="w-11 h-11 rounded-full bg-ink-100 justify-center items-center"
                onPress={onItineraire}
                activeOpacity={0.7}
              >
                <MapPin size={22} color="#14532d" />
              </TouchableOpacity>
            )}
          </View>

          {restaurant.modesCommande.length > 0 && (
            <View className="flex-row flex-wrap mt-3 mx-auto bg-ink-200 justify-between gap-4 px-3 py-2 rounded-2xl">
              {restaurant.modesCommande.map((mode) => (
                <View key={mode}>
                  <Text className="text-sm font-semibold">
                    {MODE_LABELS[mode] ?? mode}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Bloc stats : avis / note / temps d'attente */}
          <View className="flex-row mt-3 bg-ink-100 rounded-2xl p-3 justify-around">
            <View className="flex items-center">
              <Text className="text-base font-bold">
                {aDesAvis ? restaurant.nombreAvis : "—"}
              </Text>
              <Text className="text-xs text-ink-500 mt-1">Avis</Text>
            </View>
            <View className="flex items-center">
              <View className="flex-row items-center space-x-1">
                <Star size={14} color="#374151" strokeWidth={2.5} />
                <Text className="text-base font-bold ml-1">
                  {aDesAvis ? restaurant.noteMoyenne.toFixed(1) : "Nouveau"}
                </Text>
              </View>
              <Text className="text-xs text-ink-500 mt-1">Note moyenne</Text>
            </View>
            <View className="flex items-center">
              <View className="flex-row items-center justify-end space-x-1">
                <Clock size={14} color="#14532d" strokeWidth={2.5} />
                <Text className="text-base font-bold ml-1">
                  {restaurant.tempsAttente?.label ??
                    (restaurant.tempsPreparationMoyen
                      ? `~${restaurant.tempsPreparationMoyen} min`
                      : "—")}
                </Text>
              </View>
              <Text className="text-xs text-ink-500 mt-1">Temps d&apos;attente</Text>
            </View>
          </View>
        </Card>
        <View className=" bg-ink-50 w-[90%] mx-auto mt-3">
          {restaurant.description && (
            <View className="mt-4">
              <Text className="text-xl tracking-wider font-bold text-ink-900 mb-2">
                À propos
              </Text>
              <Text
                className="text-base text-ink-700 leading-6 tracking-wider"
                numberOfLines={3}
              >
                {restaurant.description}
              </Text>
            </View>
          )}

          {/* Contact — un seul bloc, URL de dev filtrée */}
          {(restaurant.telephone || restaurant.email || restaurant.siteWeb) && (
            <View className="mt-4">
              <Text className="text-xl tracking-wider font-bold text-ink-900 mb-2">
                Contact
              </Text>
              <View className="flex-row items-center flex-wrap gap-3">
                {restaurant.telephone && (
                  <Text className="text-base text-ink-700 mt-2">
                    {restaurant.telephone}
                  </Text>
                )}
                {restaurant.email && (
                  <Text className="text-base text-ink-700 mt-2">
                    {restaurant.email}
                  </Text>
                )}
                {/* {restaurant.siteWeb && (
                <Text className="text-base text-ink-700 mt-2">
                  {restaurant.siteWeb}
                </Text>
              )} */}
              </View>
            </View>
          )}

          {popularPlats.length > 0 && (
            <View className="mt-4">
              <Text className="text-xl font-bold text-ink-900 tracking-wider mb-2">
                Plats populaires
              </Text>
            <FlatList
              data={popularPlats}
              keyExtractor={(p) => p.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              renderItem={({ item: p }) => (
                <TouchableOpacity
                  className="w-32 mr-4"
                  onPress={onVoirMenu ?? (() => {})}
                  activeOpacity={0.8}
                >
                  {p.photoUrl ? (
                    <Image
                      source={p.photoUrl}
                      style={{ width: 120, height: 90, borderRadius: 12, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" }}
                    />
                  ) : (
                    <View
                      className="rounded-2xl"
                      style={{
                        width: 120,
                        height: 90,
                        backgroundColor: "#eef2e9",
                        borderWidth: 1,
                        borderColor: "rgba(0,0,0,0.1)",
                      }}
                    />
                  )}
                  <Text
                    className="mt-2 text-base text-ink-900 font-semibold"
                    numberOfLines={1}
                  >
                    {p.nom}
                  </Text>
                  <Text className="text-base text-green-700 mt-1 font-bold">
                    {formatPrix(p.prix)}
                  </Text>
                </TouchableOpacity>
              )}
            />
            </View>
          )}
        </View>
      </View>
    </>
  );
};

export default HeaderRestaurant;
