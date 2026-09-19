import { RestaurantDetailActionRow } from "@/components/restaurant-detail/restaurant-detail-action-row";
import {
  RestaurantDetailIcon,
  restaurantDetailIcons,
} from "@/components/restaurant-detail/restaurant-detail-icon";
import { getRestaurantWebUrl } from "@/constants/urls";
import { useStore } from "@/store";
import type { Restaurant } from "@/types";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface RestaurantDetailContentProps {
  restaurant: Restaurant;
  onItineraire?: () => void;
  onVoirMenu?: () => void;
}

const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";
const FALLBACK_IMAGE = require("@/assets/images/default_hero_bg.jpg");

export function RestaurantDetailContent({
  restaurant,
  onItineraire,
  onVoirMenu,
}: RestaurantDetailContentProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const favorites = useStore((state) => state.favorites);
  const [isFavPending, setIsFavPending] = useState(false);

  const isFavorite = favorites.some(
    (favorite) =>
      favorite.id === restaurant.id || favorite.slug === restaurant.slug,
  );

  const description = useMemo(() => {
    const value = restaurant.description?.trim();
    if (value) return value;

    return [
      restaurant.cuisines?.join(" · "),
      restaurant.adresse,
      restaurant.ville,
    ]
      .filter(Boolean)
      .join(" · ");
  }, [restaurant]);
  const distance = restaurant.geo?.distanceKm ?? restaurant.distanceKm;
  const isOpen = restaurant.enLigne && restaurant.accepteCommandes;
  const itinerarySubtitle = [
    typeof distance === "number"
      ? `${distance.toLocaleString("fr-FR", {
          maximumFractionDigits: 1,
          minimumFractionDigits: distance < 10 ? 1 : 0,
        })} km de vous`
      : null,
    isOpen ? "Ouvert maintenant" : "Fermé actuellement",
  ]
    .filter(Boolean)
    .join(" · ");

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
  }, [isFavPending, restaurant, toggleFavorite]);

  const handleShare = useCallback(async () => {
    const url = getRestaurantWebUrl(restaurant.slug);
    const title = `Découvrir ${restaurant.nom} sur ToutCi`;

    try {
      await Share.share(
        process.env.EXPO_OS === "ios"
          ? {
              title,
              message: `Découvrez ${restaurant.nom} sur ToutCi.`,
              url,
            }
          : {
              title,
              message: `Découvrez ${restaurant.nom} sur ToutCi.\n${url}`,
            },
        { dialogTitle: `Partager ${restaurant.nom}`, subject: title },
      );
    } catch {
      Alert.alert(
        "Partage impossible",
        "Le lien du restaurant n’a pas pu être partagé.",
      );
    }
  }, [restaurant.nom, restaurant.slug]);

  const handlePhonePress = useCallback(async () => {
    if (!restaurant.telephone) return;

    try {
      await Linking.openURL(`tel:${restaurant.telephone}`);
    } catch {
      Alert.alert(
        "Appel impossible",
        "Cet appareil ne permet pas de lancer un appel téléphonique.",
      );
    }
  }, [restaurant.telephone]);

  const handleWebsitePress = useCallback(async () => {
    if (!restaurant.siteWeb) return;
    const url = /^https?:\/\//i.test(restaurant.siteWeb)
      ? restaurant.siteWeb
      : `https://${restaurant.siteWeb}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Site indisponible",
        "Le site de cet établissement ne peut pas être ouvert.",
      );
    }
  }, [restaurant.siteWeb]);

  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.toolbar, { paddingTop: insets.top + 4 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Revenir à l’écran précédent"
          hitSlop={12}
          onPress={() => router.back()}
          style={[styles.toolbarButton]}
        >
          <RestaurantDetailIcon
            frameSize={44}
            name={restaurantDetailIcons.back}
            size={23}
          />
        </Pressable>

        <View style={styles.toolbarActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Partager ${restaurant.nom}`}
            hitSlop={10}
            onPress={handleShare}
            style={[styles.toolbarButton]}
          >
            <RestaurantDetailIcon
              frameSize={44}
              name={restaurantDetailIcons.share}
              size={26}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
            }
            accessibilityState={{ checked: isFavorite, disabled: isFavPending }}
            disabled={isFavPending}
            hitSlop={10}
            onPress={handleToggleFavorite}
            style={[styles.toolbarButton]}
          >
            <RestaurantDetailIcon
              frameSize={44}
              name={
                isFavorite
                  ? restaurantDetailIcons.heartFilled
                  : restaurantDetailIcons.heart
              }
              size={27}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.heroShell}>
        <Image
          cachePolicy="memory-disk"
          contentFit="cover"
          placeholder={{ blurhash: BLUR_HASH }}
          placeholderContentFit="cover"
          source={restaurant.banniereUrl || FALLBACK_IMAGE}
          style={styles.heroImage}
          transition={180}
        />
        <View pointerEvents="none" style={styles.carouselIndicator}>
          <View style={styles.carouselDot} />
        </View>
      </View>

      <View style={styles.intro}>
        <Text style={styles.name}>{restaurant.nom}</Text>
        {!!description && (
          <Text numberOfLines={3} style={styles.summary}>
            {description}
          </Text>
        )}

        <View style={styles.ratingRow}>
          <RestaurantDetailIcon
            frameSize={22}
            name={restaurantDetailIcons.star}
            size={20}
          />
          <Text style={styles.rating}>
            {restaurant.noteMoyenne?.toLocaleString("fr-FR", {
              maximumFractionDigits: 1,
              minimumFractionDigits: 1,
            }) ?? "—"}
          </Text>
          <Text style={styles.reviewCount}>{restaurant.nombreAvis} avis</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.actionList}>
        {!!onVoirMenu && (
          <RestaurantDetailActionRow
            icon={restaurantDetailIcons.menu}
            onPress={onVoirMenu}
            subtitle="Découvrir les plats"
            title="Menu"
          />
        )}
        {!!onItineraire && (
          <RestaurantDetailActionRow
            icon={restaurantDetailIcons.directions}
            onPress={onItineraire}
            subtitle={itinerarySubtitle}
            title="Itinéraire"
          />
        )}
        {!!restaurant.telephone && (
          <RestaurantDetailActionRow
            icon={restaurantDetailIcons.phone}
            onPress={handlePhonePress}
            subtitle="Contacter l’établissement"
            title="Appeler"
          />
        )}
        {!!restaurant.siteWeb && (
          <RestaurantDetailActionRow
            icon={restaurantDetailIcons.website}
            onPress={handleWebsitePress}
            subtitle="Consulter le site officiel"
            title="Voir le site"
          />
        )}
      </View>

      {!!description && (
        <View style={styles.about}>
          <Text style={styles.aboutTitle}>À propos</Text>
          <Text style={styles.aboutText}>{description}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "transparent",
    paddingBottom: 32,
  },
  toolbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 82,
    paddingBottom: 12,
    paddingHorizontal: 10,
  },
  toolbarActions: {
    flexDirection: "row",
    gap: 2,
  },
  toolbarButton: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  heroShell: {
    aspectRatio: 1.04,
    borderCurve: "continuous",
    borderRadius: 30,
    marginHorizontal: 18,
    overflow: "hidden",
    position: "relative",
  },
  heroImage: {
    height: "100%",
    width: "100%",
  },
  carouselIndicator: {
    alignItems: "center",
    bottom: 13,
    left: 0,
    position: "absolute",
    right: 0,
  },
  carouselDot: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    height: 6,
    width: 32,
  },
  intro: {
    alignItems: "center",
    paddingHorizontal: 30,
    paddingTop: 27,
  },
  name: {
    color: "#101010",
    fontSize: 29,
    fontWeight: "700",
    letterSpacing: -0.6,
    lineHeight: 36,
    textAlign: "center",
  },
  summary: {
    color: "#66666A",
    fontSize: 16,
    lineHeight: 23,
    marginTop: 14,
    textAlign: "center",
  },
  ratingRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 19,
  },
  rating: {
    color: "#171717",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
    lineHeight: 22,
  },
  reviewCount: {
    color: "#171717",
    fontSize: 16,
    fontVariant: ["tabular-nums"],
    lineHeight: 22,
    marginLeft: 5,
    textDecorationLine: "underline",
  },
  divider: {
    backgroundColor: "#D7D7D7",
    height: 1.2,
    marginHorizontal: 68,
    marginTop: 27,
  },
  actionList: {
    paddingHorizontal: 23,
    paddingTop: 23,
  },
  about: {
    paddingHorizontal: 22,
    paddingTop: 31,
  },
  aboutTitle: {
    color: "#111111",
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 28,
  },
  aboutText: {
    color: "#66666A",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
  },
});
