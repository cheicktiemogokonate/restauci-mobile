import { RestaurantDetailActionRow } from "@/components/restaurant-detail/restaurant-detail-action-row";
import {
  RestaurantDetailIcon,
  restaurantDetailIcons,
} from "@/components/restaurant-detail/restaurant-detail-icon";
import { Button } from "@/components/ui/button";
import { ErrorView } from "@/components/ui/ErrorView";
import { Text as ButtonText } from "@/components/ui/text";
import {
  addResidenceDays,
  formatResidenceDate,
  getDefaultResidenceStay,
  isIsoResidenceDate,
} from "@/domain/residenceSearch";
import { usePosition } from "@/hooks/usePosition";
import {
  useCreateResidenceReservation,
  useRecordResidenceDetailOpen,
  useResidence,
  useResidenceAvailability,
  useResidenceQuote,
} from "@/hooks/useResidences";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import { useItineraryRequestStore } from "@/store/itinerary-request-store";
import type { ResidencePaymentMethod } from "@/types/residences";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  CalendarDays,
  Minus,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

const BLUR_HASH = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";
const FALLBACK_IMAGE = require("@/assets/images/default_hero_bg.jpg");

function valueOf(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function initialStay(params: {
  checkIn?: string | string[];
  checkOut?: string | string[];
  guests?: string | string[];
}) {
  const defaults = getDefaultResidenceStay();
  const checkIn = valueOf(params.checkIn);
  const checkOut = valueOf(params.checkOut);
  const guestValue = Number(valueOf(params.guests));
  const datesAreValid =
    isIsoResidenceDate(checkIn) &&
    isIsoResidenceDate(checkOut) &&
    checkOut > checkIn;

  return {
    checkIn: datesAreValid ? checkIn : defaults.checkIn,
    checkOut: datesAreValid ? checkOut : defaults.checkOut,
    guests:
      Number.isInteger(guestValue) && guestValue >= 1 && guestValue <= 100
        ? guestValue
        : defaults.guests,
  };
}

export default function ResidenceDetailScreen() {
  const params = useLocalSearchParams<{
    slug?: string | string[];
    checkIn?: string | string[];
    checkOut?: string | string[];
    guests?: string | string[];
    discoveryToken?: string | string[];
  }>();
  const slug = valueOf(params.slug);
  const discoveryToken = valueOf(params.discoveryToken);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const client = useStore((state) => state.client);
  const favorites = useStore((state) => state.favorites);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const requestItinerary = useItineraryRequestStore(
    (state) => state.requestItinerary,
  );
  const { coords } = usePosition();

  const residence = useResidence(slug ?? null);
  const availability = useResidenceAvailability(residence.data?.id ?? null);
  const [stay, setStay] = useState(() => initialStay(params));
  const [paymentMethod, setPaymentMethod] =
    useState<ResidencePaymentMethod>("mobile_money");
  const [isFavPending, setIsFavPending] = useState(false);

  const selectedGuests = Math.min(
    stay.guests,
    residence.data?.maxGuests ?? 100,
  );
  const quote = useResidenceQuote({
    residenceId: residence.data?.id ?? null,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    guests: selectedGuests,
  });
  const createReservation = useCreateResidenceReservation();

  useRecordResidenceDetailOpen(discoveryToken);

  const item = residence.data;
  const cover = item?.photos[0]?.url;

  const isFavorite = Boolean(
    item &&
      favorites.some((fav) => fav.id === item.id || fav.slug === item.slug),
  );

  const canBook = Boolean(
    item?.bookability.isBookable &&
      quote.data?.available &&
      quote.data.bookabilityBlockers.length === 0 &&
      !createReservation.isPending,
  );

  const nightsLabel = useMemo(
    () =>
      quote.data
        ? `${quote.data.nights} nuit${quote.data.nights > 1 ? "s" : ""}`
        : "Devis serveur en cours",
    [quote.data],
  );

  const distanceKm = useMemo(() => {
    if (!coords || !item) return null;
    const lat1 = coords.latitude;
    const lon1 = coords.longitude;
    const lat2 = item.latitude;
    const lon2 = item.longitude;
    if (
      typeof lat2 !== "number" ||
      typeof lon2 !== "number" ||
      !Number.isFinite(lat1) ||
      !Number.isFinite(lon1) ||
      !Number.isFinite(lat2) ||
      !Number.isFinite(lon2)
    ) {
      return null;
    }
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [coords, item]);

  const itinerarySubtitle = useMemo(() => {
    if (!item) return "";
    const distText =
      typeof distanceKm === "number"
        ? `${distanceKm.toLocaleString("fr-FR", {
            maximumFractionDigits: 1,
            minimumFractionDigits: distanceKm < 10 ? 1 : 0,
          })} km de vous`
        : null;
    return [distText, `${item.city}, ${item.country}`]
      .filter(Boolean)
      .join(" · ");
  }, [distanceKm, item]);

  const changeCheckIn = useCallback((days: number) => {
    setStay((current) => {
      const next = addResidenceDays(current.checkIn, days);
      if (next < getDefaultResidenceStay().checkIn) return current;
      return {
        ...current,
        checkIn: next,
        checkOut:
          current.checkOut <= next
            ? addResidenceDays(next, 1)
            : current.checkOut,
      };
    });
  }, []);

  const changeCheckOut = useCallback((days: number) => {
    setStay((current) => {
      const next = addResidenceDays(current.checkOut, days);
      return next <= current.checkIn
        ? current
        : { ...current, checkOut: next };
    });
  }, []);

  const handleToggleFavorite = useCallback(async () => {
    if (!item || isFavPending) return;
    setIsFavPending(true);
    try {
      await toggleFavorite({
        id: item.id,
        nom: item.title,
        slug: item.slug,
        logoUrl: cover ?? null,
        banniereUrl: cover ?? null,
      });
    } catch {
      Alert.alert(
        "Favori non enregistré",
        "Impossible d’enregistrer ce favori sur l’appareil.",
      );
    } finally {
      setIsFavPending(false);
    }
  }, [cover, isFavPending, item, toggleFavorite]);

  const handleShare = useCallback(async () => {
    if (!item) return;
    const title = `Découvrir ${item.title} sur ToutCi`;
    const url = `https://toutci.ci/residences/${item.slug}`;

    try {
      await Share.share(
        process.env.EXPO_OS === "ios"
          ? {
              title,
              message: `Découvrez la résidence ${item.title} (${item.city}) sur ToutCi.`,
              url,
            }
          : {
              title,
              message: `Découvrez la résidence ${item.title} (${item.city}) sur ToutCi.\n${url}`,
            },
        { dialogTitle: `Partager ${item.title}`, subject: title },
      );
    } catch {
      Alert.alert(
        "Partage impossible",
        "Le lien de la résidence n’a pas pu être partagé.",
      );
    }
  }, [item]);

  const handleItineraire = useCallback(() => {
    if (!item) return;

    if (!coords) {
      Alert.alert(
        "Position requise",
        "Une position est nécessaire pour tracer l’itinéraire sur la carte.",
      );
      return;
    }

    if (
      typeof item.latitude !== "number" ||
      typeof item.longitude !== "number"
    ) {
      Alert.alert(
        "Coordonnées indisponibles",
        "La position exacte de cette résidence n'est pas renseignée.",
      );
      return;
    }

    requestItinerary({
      origin: coords,
      etablissement: {
        id: item.id,
        latitude: item.latitude,
        longitude: item.longitude,
        nom: item.title,
        slug: item.slug,
        type: "residence",
      },
    });
    router.back();
  }, [coords, item, requestItinerary, router]);

  const scrollToStayConfig = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 560, animated: true });
  }, []);

  const submit = useCallback(() => {
    if (!item) return;
    if (!client) {
      const query = new URLSearchParams({
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: String(selectedGuests),
        ...(discoveryToken ? { discoveryToken } : {}),
      });
      router.push({
        pathname: "/auth/login",
        params: {
          redirectTo: `/residences/${item.slug}?${query.toString()}`,
        },
      });
      return;
    }
    if (!canBook) {
      Alert.alert(
        "Séjour indisponible",
        quote.error?.message ??
          "Vérifiez vos dates ou choisissez une autre résidence.",
      );
      return;
    }
    createReservation.mutate(
      {
        residenceId: item.id,
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
        guests: selectedGuests,
        paymentMethod,
        discoveryToken: discoveryToken || undefined,
      },
      {
        onSuccess: (result) => {
          void Linking.openURL(result.checkoutUrl).catch(() => {
            Alert.alert(
              "Paiement à reprendre",
              "La réservation est enregistrée. Reprenez le paiement depuis Mes séjours.",
            );
            router.replace(`/reservations/${result.reservationId}`);
          });
        },
        onError: (error) =>
          Alert.alert("Réservation impossible", error.message),
      },
    );
  }, [
    canBook,
    client,
    createReservation,
    discoveryToken,
    item,
    paymentMethod,
    quote.error?.message,
    router,
    selectedGuests,
    stay.checkIn,
    stay.checkOut,
  ]);

  if (residence.isPending) {
    return (
      <View style={[styles.centerLoading, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={theme.green900} />
      </View>
    );
  }

  if (residence.isError || !item) {
    return (
      <View style={[styles.errorViewContainer, { paddingTop: insets.top }]}>
        <ErrorView
          message={residence.error?.message ?? "Résidence introuvable"}
          onRetry={() => void residence.refetch()}
        />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 140 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Toolbar — Structure identique à Restaurant */}
          <View style={[styles.toolbar, { paddingTop: insets.top + 4 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Revenir à l’écran précédent"
              hitSlop={12}
              onPress={() => router.back()}
              style={styles.toolbarButton}
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
                accessibilityLabel={`Partager ${item.title}`}
                hitSlop={10}
                onPress={() => void handleShare()}
                style={styles.toolbarButton}
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
                accessibilityState={{
                  checked: isFavorite,
                  disabled: isFavPending,
                }}
                disabled={isFavPending}
                hitSlop={10}
                onPress={() => void handleToggleFavorite()}
                style={styles.toolbarButton}
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

          {/* Hero photo shell — Dimensions et design identiques à Restaurant */}
          <View style={styles.heroShell}>
            <Image
              cachePolicy="memory-disk"
              contentFit="cover"
              placeholder={{ blurhash: BLUR_HASH }}
              placeholderContentFit="cover"
              source={cover ? { uri: cover } : FALLBACK_IMAGE}
              style={styles.heroImage}
              transition={180}
              accessibilityLabel={`Photo de ${item.title}`}
            />
            <View pointerEvents="none" style={styles.carouselIndicator}>
              <View style={styles.carouselDot} />
            </View>
          </View>

          {/* Centered Intro — Typographie identique à Restaurant */}
          <View style={styles.intro}>
            <Text style={styles.name}>{item.title}</Text>
            <Text style={styles.summary} numberOfLines={3}>
              {item.city}, {item.country} · {item.maxGuests} voyageurs · Résidence entière
            </Text>

            <View style={styles.ratingRow}>
              <RestaurantDetailIcon
                frameSize={22}
                name={restaurantDetailIcons.star}
                size={20}
              />
              <Text style={styles.rating}>5.0</Text>
              <Text style={styles.reviewCount}>Résidence vérifiée</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Rows — Adaptées à la transversale Résidence */}
          <View style={styles.actionList}>
            <RestaurantDetailActionRow
              icon={restaurantDetailIcons.calendar}
              onPress={scrollToStayConfig}
              subtitle={`${formatResidenceDate(stay.checkIn)} – ${formatResidenceDate(stay.checkOut)} · ${nightsLabel}`}
              title="Dates du séjour"
            />
            <RestaurantDetailActionRow
              icon={restaurantDetailIcons.directions}
              onPress={handleItineraire}
              subtitle={itinerarySubtitle || "Voir l’itinéraire sur la carte"}
              title="Itinéraire"
            />
            <RestaurantDetailActionRow
              icon={restaurantDetailIcons.guests}
              onPress={scrollToStayConfig}
              subtitle={`${selectedGuests} voyageur${selectedGuests > 1 ? "s" : ""} · Max ${item.maxGuests}`}
              title="Voyageurs"
            />
            <RestaurantDetailActionRow
              icon={restaurantDetailIcons.house}
              onPress={scrollToStayConfig}
              subtitle="Logement entier à votre disposition"
              title="Type de bien"
            />
          </View>

          {/* À propos */}
          {!!item.description && (
            <View style={styles.about}>
              <Text style={styles.aboutTitle}>À propos</Text>
              <Text style={styles.aboutText}>{item.description}</Text>
            </View>
          )}

          {/* Bannière d’avertissement si non réservable */}
          {!item.bookability.isBookable && (
            <View style={styles.warningBanner}>
              <Text style={styles.warningBannerTitle}>
                Réservation temporairement indisponible
              </Text>
              <Text style={styles.warningBannerText}>
                Cette résidence reste consultable, mais le partenaire ne peut
                pas encore recevoir de paiement en ligne.
              </Text>
            </View>
          )}

          {/* Configuration du séjour (Dates & Voyageurs) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Votre séjour</Text>
            <View style={styles.stayConfigList}>
              {(
                [
                  ["Arrivée", stay.checkIn, changeCheckIn],
                  ["Départ", stay.checkOut, changeCheckOut],
                ] as const
              ).map(([label, value, change]) => (
                <View key={label} style={styles.stayConfigRow}>
                  <View style={styles.stayConfigInfo}>
                    <CalendarDays size={20} color={theme.green900} />
                    <View>
                      <Text style={styles.stayConfigLabel}>{label}</Text>
                      <Text style={styles.stayConfigValue}>
                        {formatResidenceDate(value)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.stayStepper}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Reculer la date de ${label.toLowerCase()}`}
                      onPress={() => change(-1)}
                      style={styles.stepperButtonSecondary}
                    >
                      <Minus size={17} color={theme.green900} />
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Avancer la date de ${label.toLowerCase()}`}
                      onPress={() => change(1)}
                      style={styles.stepperButtonPrimary}
                    >
                      <Plus size={17} color="white" />
                    </Pressable>
                  </View>
                </View>
              ))}

              <View style={styles.stayConfigRow}>
                <View style={styles.stayConfigInfo}>
                  <Users size={20} color={theme.green900} />
                  <View>
                    <Text style={styles.stayConfigLabel}>Voyageurs</Text>
                    <Text style={styles.stayConfigValue}>
                      {selectedGuests} voyageur{selectedGuests > 1 ? "s" : ""}
                    </Text>
                  </View>
                </View>
                <View style={styles.stayStepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retirer un voyageur"
                    onPress={() =>
                      setStay((current) => ({
                        ...current,
                        guests: Math.max(1, selectedGuests - 1),
                      }))
                    }
                    style={styles.stepperButtonSecondary}
                  >
                    <Minus size={17} color={theme.green900} />
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ajouter un voyageur"
                    onPress={() =>
                      setStay((current) => ({
                        ...current,
                        guests: Math.min(item.maxGuests, selectedGuests + 1),
                      }))
                    }
                    style={styles.stepperButtonPrimary}
                  >
                    <Plus size={17} color="white" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>

          {/* Périodes indisponibles */}
          {availability.data?.unavailable &&
          availability.data.unavailable.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Périodes indisponibles</Text>
              <View style={styles.unavailableList}>
                {availability.data.unavailable.slice(0, 4).map((period) => (
                  <View
                    key={`${period.checkIn}-${period.checkOut}-${period.source}`}
                    style={styles.unavailableItem}
                  >
                    <Text style={styles.unavailableDates}>
                      {formatResidenceDate(period.checkIn)} →{" "}
                      {formatResidenceDate(period.checkOut)}
                    </Text>
                    <Text style={styles.unavailableSource}>
                      {period.source === "reservation"
                        ? "Séjour déjà réservé"
                        : "Dates bloquées par l’hôte"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Mode de paiement sécurisé */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paiement sécurisé</Text>
            <View style={styles.paymentMethodsRow}>
              {(["mobile_money", "card"] as const).map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <Pressable
                    key={method}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    onPress={() => setPaymentMethod(method)}
                    style={[
                      styles.paymentMethodCard,
                      isSelected && styles.paymentMethodCardSelected,
                    ]}
                  >
                    <ShieldCheck size={20} color={theme.green900} />
                    <Text style={styles.paymentMethodTitle}>
                      {method === "mobile_money"
                        ? "Mobile money"
                        : "Carte bancaire"}
                    </Text>
                    <Text style={styles.paymentMethodSubtitle}>
                      {method === "mobile_money"
                        ? "Wave, Orange, MTN"
                        : "Visa, Mastercard"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Barre de réservation sticky en bas */}
        <View
          style={[
            styles.bottomBar,
            { paddingBottom: Math.max(insets.bottom, 14) + 6 },
          ]}
        >
          <View style={styles.bottomBarRow}>
            <View>
              <Text style={styles.bottomBarPrice}>
                {quote.data
                  ? formatPrix(quote.data.totalFcfa)
                  : formatPrix(item.pricePerNightFcfa)}
              </Text>
              <Text style={styles.bottomBarSubtitle}>{nightsLabel}</Text>
            </View>
            {quote.isFetching ? (
              <ActivityIndicator color={theme.green900} />
            ) : quote.isError ? (
              <Pressable onPress={() => void quote.refetch()}>
                <Text style={styles.bottomBarError}>
                  Devis indisponible · Réessayer
                </Text>
              </Pressable>
            ) : quote.data && !quote.data.available ? (
              <Text style={styles.bottomBarError}>Dates indisponibles</Text>
            ) : null}
          </View>
          <Button
            onPress={submit}
            disabled={
              (Boolean(client) && !canBook) || createReservation.isPending
            }
          >
            {createReservation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <ButtonText>
                {client ? "Réserver et payer" : "Se connecter pour réserver"}
              </ButtonText>
            )}
          </Button>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centerLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  errorViewContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
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
  warningBanner: {
    marginHorizontal: 22,
    marginTop: 24,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FDE68A",
    backgroundColor: "#FFFBEB",
  },
  warningBannerTitle: {
    fontWeight: "700",
    color: "#78350F",
    fontSize: 14,
  },
  warningBannerText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: "#92400E",
  },
  section: {
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  sectionTitle: {
    color: "#111111",
    fontSize: 21,
    fontWeight: "700",
    lineHeight: 28,
    marginBottom: 14,
  },
  stayConfigList: {
    gap: 12,
  },
  stayConfigRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
  },
  stayConfigInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stayConfigLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    color: theme.ink400,
  },
  stayConfigValue: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.ink900,
    marginTop: 2,
  },
  stayStepper: {
    flexDirection: "row",
    gap: 8,
  },
  stepperButtonSecondary: {
    height: 38,
    width: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.ink100,
  },
  stepperButtonPrimary: {
    height: 38,
    width: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.green900,
  },
  unavailableList: {
    gap: 8,
  },
  unavailableItem: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: theme.ink100,
  },
  unavailableDates: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.ink700,
  },
  unavailableSource: {
    fontSize: 12,
    color: theme.ink400,
    marginTop: 2,
  },
  paymentMethodsRow: {
    flexDirection: "row",
    gap: 12,
  },
  paymentMethodCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
  },
  paymentMethodCardSelected: {
    borderColor: "#15803D",
    backgroundColor: theme.green50,
  },
  paymentMethodTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.ink900,
    marginTop: 8,
  },
  paymentMethodSubtitle: {
    fontSize: 12,
    color: theme.ink500,
    marginTop: 2,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 22,
    paddingTop: 12,
    boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.06)",
  },
  bottomBarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  bottomBarPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.green900,
    lineHeight: 28,
  },
  bottomBarSubtitle: {
    fontSize: 13,
    color: theme.ink500,
    marginTop: 2,
  },
  bottomBarError: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.danger700,
  },
});
