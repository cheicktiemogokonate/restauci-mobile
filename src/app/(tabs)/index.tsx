import { CarteView, type CarteViewRef } from "@/components/carte/CarteView";
import { AnimatedEtablissementMapCard } from "@/components/carte/animated-etablissement-map-card";
import { EtablissementMapCard } from "@/components/carte/etablissement-map-card";
import { SearchBar } from "@/components/carte/SearchBar";
import { MoodOverlay } from "@/components/mood/MoodOverlay";
import {
  VERTICALS,
  getVerticalDefinition,
  type VerticalFilter,
} from "@/constants/verticals";
import {
  createDevelopmentCoords,
  DEVELOPMENT_LOCATIONS,
  findClosestDevelopmentLocation,
  getDevelopmentLocation,
  type DevelopmentLocationId,
} from "@/constants/development-locations";
import { ITINERARY_VISUAL_CONFIG } from "@/constants/itinerary-style";
import {
  MOOD_BLUR_INTENSITY,
  MOOD_SOFT_VEIL_COLOR,
} from "@/constants/visual-effects";
import {
  calculerItineraireRoutier,
  createItineraryGeoJSON,
  getItineraryBounds,
  normalizeItineraryCoordinates,
} from "@/domain/itinerary";
import { useCuisinesDisponibles } from "@/hooks/useCuisinesDisponibles";
import {
  useEtablissements,
  useMoodDiscovery,
  type MoodType,
} from "@/hooks/useEtablissements";
import { fetchRestaurant } from "@/hooks/useMenuRestaurant";
import { usePosition, type Coords } from "@/hooks/usePosition";
import { useStore } from "@/store";
import {
  useItineraryRequestStore,
  type ItineraryRequest,
} from "@/store/itinerary-request-store";
import type { Etablissement } from "@/types/etablissement";
import { BlurTargetView, BlurView } from "expo-blur";
import {
  useFocusEffect,
  useGlobalSearchParams,
  useRouter,
} from "expo-router";
import {
  GlobeOff,
  Layers3,
  List,
  LocateFixed,
  Map,
  MapPinOff,
  SearchX,
  Sparkles,
  X,
} from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ============================================
// Écran Carte — assemblage principal unifié
// ============================================
export default function CarteScreen() {
  const router = useRouter();
  const searchParams = useGlobalSearchParams<{
    etablissementId?: string;
    vertical?: VerticalFilter;
    mode?: "carte" | "liste";
  }>();
  const insets = useSafeAreaInsets();
  const favorites = useStore((state) => state.favorites);
  const toggleFavorite = useStore((state) => state.toggleFavorite);
  const {
    coords,
    loading: positionLoading,
    error: positionError,
    recentrer,
  } = usePosition();

  const carteRef = useRef<CarteViewRef>(null);
  const blurTargetRef = useRef<View | null>(null);
  const [moodOuvert, setMoodOuvert] = useState(false);
  const [activeMood, setActiveMood] = useState<{
    id: MoodType;
    label: string;
  } | null>(null);
  const [activeMoodQuery, setActiveMoodQuery] = useState<string | null>(null);
  const [developmentLocationId, setDevelopmentLocationId] =
    useState<DevelopmentLocationId | null>(null);
  const [selectedVertical, setSelectedVertical] = useState<VerticalFilter>(
    () =>
      searchParams.vertical &&
      (searchParams.vertical === "tous" || searchParams.vertical in VERTICALS)
        ? searchParams.vertical
        : "tous",
  );
  const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
  const [internalMode, setInternalMode] = useState<"carte" | "liste">("carte");
  const modeAffichage =
    searchParams.mode === "carte" || searchParams.mode === "liste"
      ? searchParams.mode
      : internalMode;

  const setModeAffichage = useCallback(
    (
      action:
        | "carte"
        | "liste"
        | ((prev: "carte" | "liste") => "carte" | "liste"),
    ) => {
      setInternalMode((prevInternal) => {
        const current =
          searchParams.mode === "carte" || searchParams.mode === "liste"
            ? searchParams.mode
            : prevInternal;
        const next =
          typeof action === "function" ? action(current) : action;
        if (searchParams.mode && searchParams.mode !== next) {
          router.setParams({ mode: next });
        }
        return next;
      });
    },
    [router, searchParams.mode],
  );
  const [etablissementSelectionne, setEtablissementSelectionne] =
    useState<Etablissement | null>(null);
  const [itineraireGeoJSON, setItineraireGeoJSON] =
    useState<GeoJSON.FeatureCollection<GeoJSON.LineString> | null>(null);
  const [itineraireOrigin, setItineraireOrigin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [centreRecherche, setCentreRecherche] = useState<Coords | null>(null);
  const [centreEnAttente, setCentreEnAttente] = useState<
    [number, number] | null
  >(null);
  const pendingEtablissementId = useRef<string | null>(
    searchParams.etablissementId ?? null,
  );

  // Position effective pour la recherche géolocalisée
  const searchLocation =
    centreRecherche ??
    (!positionLoading && !positionError ? coords : null);

  const developmentLocationCoords = useMemo(
    () =>
      developmentLocationId
        ? createDevelopmentCoords(developmentLocationId)
        : null,
    [developmentLocationId],
  );

  const moodLocation = useMemo(
    () =>
      developmentLocationId
        ? getDevelopmentLocation(developmentLocationId)
        : findClosestDevelopmentLocation(searchLocation ?? coords),
    [coords, developmentLocationId, searchLocation],
  );

  // Recherche unifiée (restaurants + résidences) ou découverte par Mood
  const isMoodActive = Boolean(activeMood || activeMoodQuery);

  const moodFilter = useMemo(
    () => ({
      mood: activeMood?.id ?? null,
      query: activeMoodQuery ?? null,
      type: "tous" as const,
    }),
    [activeMood, activeMoodQuery],
  );

  const standardQuery = useEtablissements(searchLocation, {
    type: "tous",
    search: selectedCuisine,
    radiusKm: 50,
  });

  const moodQuery = useMoodDiscovery(
    searchLocation,
    moodFilter,
    isMoodActive,
  );

  const activeQuery = isMoodActive ? moodQuery : standardQuery;
  const {
    data: etablissements = [],
    isLoading: etablissementsLoading,
    error: etablissementsError,
    refetch: refetchEtablissements,
  } = activeQuery;

  const verticalCounts = useMemo<Record<VerticalFilter, number>>(() => {
    const counts: Record<VerticalFilter, number> = {
      tous: etablissements.length,
      restaurant: 0,
      residence: 0,
    };
    for (const item of etablissements) {
      if (item.type in counts) {
        counts[item.type as VerticalFilter] =
          (counts[item.type as VerticalFilter] ?? 0) + 1;
      }
    }
    return counts;
  }, [etablissements]);

  const displayedEtablissements = useMemo(() => {
    if (selectedVertical === "tous") return etablissements;
    return etablissements.filter((item) => item.type === selectedVertical);
  }, [etablissements, selectedVertical]);

  const handleVerticalChange = useCallback(
    (vertical: VerticalFilter) => {
      setSelectedVertical(vertical);
      if (
        etablissementSelectionne &&
        vertical !== "tous" &&
        etablissementSelectionne.type !== vertical
      ) {
        setEtablissementSelectionne(null);
      }
    },
    [etablissementSelectionne],
  );

  const { cuisines } = useCuisinesDisponibles(searchLocation);

  const handleSuggestionSelect = useCallback(
    (lat: number, lon: number, etablissementId?: string) => {
      const center: [number, number] = [lon, lat];
      carteRef.current?.flyTo(center, 15);
      setCentreRecherche({
        latitude: lat,
        longitude: lon,
        accuracyMeters: 0,
        capturedAt: new Date().toISOString(),
      });
      setCentreEnAttente(null);
      setSelectedCuisine(null);
      setSelectedVertical("tous");
      setActiveMood(null);
      setActiveMoodQuery(null);
      setModeAffichage("carte");
      setItineraireGeoJSON(null);
      setItineraireOrigin(null);
      pendingEtablissementId.current = etablissementId ?? null;

      if (etablissementId) {
        const item = etablissements.find((candidate) => candidate.id === etablissementId);
        if (item) {
          setEtablissementSelectionne(item);
          pendingEtablissementId.current = null;
        }
      } else {
        setEtablissementSelectionne(null);
      }
    },
    [etablissements, setModeAffichage],
  );

  const handleFilterChange = useCallback((cuisine: string | null) => {
    setSelectedCuisine(cuisine);
  }, []);

  const handleOpenMood = useCallback(() => {
    setModeAffichage("carte");
    setEtablissementSelectionne(null);
    setItineraireGeoJSON(null);
    setItineraireOrigin(null);
    setCentreEnAttente(null);
    setMoodOuvert(true);
  }, [setModeAffichage]);

  const handleCloseMood = useCallback(() => {
    setMoodOuvert(false);
  }, []);

  const handleRecentrer = useCallback(async () => {
    const nextCoords = await recentrer();
    if (nextCoords) {
      setDevelopmentLocationId(null);
      carteRef.current?.flyTo(
        [nextCoords.longitude, nextCoords.latitude],
        14,
      );
      setCentreRecherche(nextCoords);
      setCentreEnAttente(null);
      setEtablissementSelectionne(null);
      setItineraireGeoJSON(null);
      setItineraireOrigin(null);
    }
  }, [recentrer]);

  const handleExplorerAbidjan = useCallback(() => {
    const abidjan = createDevelopmentCoords("abidjan");
    setDevelopmentLocationId("abidjan");
    carteRef.current?.flyTo([abidjan.longitude, abidjan.latitude], 14);
    setCentreRecherche(abidjan);
    setCentreEnAttente(null);
    setSelectedCuisine(null);
    setSelectedVertical("tous");
    setActiveMood(null);
    setActiveMoodQuery(null);
    setEtablissementSelectionne(null);
    setItineraireGeoJSON(null);
    setItineraireOrigin(null);
  }, []);

  const handleDevelopmentLocationSelect = useCallback(
    (locationId: string) => {
      const location = DEVELOPMENT_LOCATIONS.find(
        (candidate) => candidate.id === locationId,
      );
      if (!location) return;

      const nextCoords = createDevelopmentCoords(location.id);
      setDevelopmentLocationId(location.id);
      carteRef.current?.flyTo(
        [nextCoords.longitude, nextCoords.latitude],
        14,
      );
      setCentreRecherche(nextCoords);
      setCentreEnAttente(null);
      setSelectedCuisine(null);
      setSelectedVertical("tous");
      setActiveMood(null);
      setEtablissementSelectionne(null);
      setItineraireGeoJSON(null);
      setItineraireOrigin(null);
    },
    [],
  );

  // Repositionner la caméra lors de la première arrivée d'un fix GPS
  useEffect(() => {
    if (positionLoading || positionError || centreRecherche) return;
    carteRef.current?.flyTo([coords.longitude, coords.latitude], 13);
  }, [centreRecherche, coords, positionError, positionLoading]);

  // Si un établissement était demandé en attente de chargement ou via paramètre d'URL
  useEffect(() => {
    const targetId = searchParams.etablissementId ?? pendingEtablissementId.current;
    if (!targetId) return;

    const match = etablissements.find((item) => item.id === targetId);
    if (match) {
      setEtablissementSelectionne(match);
      setCentreEnAttente(null);
      carteRef.current?.flyTo([match.longitude, match.latitude], 15);
      pendingEtablissementId.current = null;
    }
  }, [etablissements, searchParams.etablissementId]);


  const handleEtablissementSelect = useCallback((item: Etablissement) => {
    setEtablissementSelectionne(item);
    setItineraireGeoJSON(null);
    setItineraireOrigin(null);
    setModeAffichage("carte");
    carteRef.current?.flyTo([item.longitude, item.latitude], 15);
  }, [setModeAffichage]);

  const handleVoirEtablissement = useCallback(
    (item: Etablissement) => {
      const def = getVerticalDefinition(item.type);
      const route = def.getRoute(item.slug, searchLocation);
      router.push({
        pathname: route.pathname as any,
        params: route.params,
      });
    },
    [router, searchLocation],
  );

  const handleRechercherZone = useCallback(() => {
    if (!centreEnAttente) return;
    setCentreRecherche({
      latitude: centreEnAttente[1],
      longitude: centreEnAttente[0],
      accuracyMeters: 0,
      capturedAt: new Date().toISOString(),
    });
    setCentreEnAttente(null);
    setEtablissementSelectionne(null);
    setItineraireGeoJSON(null);
    setItineraireOrigin(null);
  }, [centreEnAttente]);

  const displayItinerary = useCallback(async (request: ItineraryRequest) => {
    setMoodOuvert(false);
    setModeAffichage("carte");
    setEtablissementSelectionne(null);
    setCentreEnAttente(null);
    setItineraireOrigin(request.origin);

    const target = request.etablissement ?? request.restaurant;
    if (!target) return;

    try {
      let coordinates = normalizeItineraryCoordinates(request.geometry);

      if (coordinates.length < 2) {
        // 1. Si restaurant, tenter de récupérer l'itinéraire précalculé depuis l'API détail
        if (!target.type || target.type === "restaurant") {
          try {
            const detail = await fetchRestaurant(
              target.slug,
              request.origin,
            );
            coordinates = normalizeItineraryCoordinates(
              detail.geo?.itineraire?.geometrie,
            );
          } catch {
            // Passer au calcul direct OSRM
          }
        }

        // 2. Si pas de géométrie ou si résidence : appel à la fonction qui calcule l'itinéraire routier (OSRM)
        if (coordinates.length < 2) {
          const roadCoords = await calculerItineraireRoutier(request.origin, {
            latitude: target.latitude,
            longitude: target.longitude,
          });
          if (roadCoords && roadCoords.length >= 2) {
            coordinates = roadCoords;
          }
        }
      }

      if (coordinates.length >= 2) {
        setItineraireGeoJSON(createItineraryGeoJSON(coordinates));
        carteRef.current?.fitBounds(
          getItineraryBounds(coordinates),
          ITINERARY_VISUAL_CONFIG.cameraPadding,
          ITINERARY_VISUAL_CONFIG.cameraDurationMs,
        );
      } else {
        setItineraireGeoJSON(null);
        Alert.alert(
          "Itinéraire indisponible",
          "Le tracé routier n’a pas pu être calculé pour cette destination.",
        );
      }
    } catch (cause) {
      setItineraireGeoJSON(null);
      if (__DEV__) {
        console.warn(
          "[Carte] itinéraire indisponible",
          cause instanceof Error ? cause.message : "erreur inconnue",
        );
      }
      Alert.alert(
        "Itinéraire indisponible",
        "Le tracé n’a pas pu être chargé pour le moment.",
      );
    }
  }, [setModeAffichage]);

  const handleMapCardItinerary = useCallback(
    (item: Etablissement) => {
      if (!searchLocation) {
        Alert.alert(
          "Position requise",
          "Une position est nécessaire pour tracer l’itinéraire sur la carte.",
        );
        return;
      }

      void displayItinerary({
        id: `map-${Date.now()}-${item.id}`,
        origin: searchLocation,
        etablissement: {
          id: item.id,
          latitude: item.latitude,
          longitude: item.longitude,
          nom: item.nom,
          slug: item.slug,
          type: item.type,
        },
      });
    },
    [displayItinerary, searchLocation],
  );


  useFocusEffect(
    useCallback(() => {
      const request = useItineraryRequestStore.getState().pendingRequest;
      if (!request) return;

      useItineraryRequestStore.getState().clearRequest();
      const animationFrame = requestAnimationFrame(() => {
        void displayItinerary(request);
      });

      return () => cancelAnimationFrame(animationFrame);
    }, [displayItinerary]),
  );

  const handleToggleFavorite = useCallback(
    (item: Etablissement) => {
      void toggleFavorite({
        id: item.id,
        nom: item.nom,
        slug: item.slug,
        logoUrl: item.imageUrl ?? item.banniereUrl ?? null,
        banniereUrl: item.banniereUrl ?? null,
      }).catch(() => {
        Alert.alert(
          "Favoris non mis à jour",
          "Impossible d’enregistrer ce favori sur l’appareil.",
        );
      });
    },
    [toggleFavorite],
  );

  const isEtablissementSelectionneFavori = etablissementSelectionne
    ? favorites.some(
        (favorite) =>
          favorite.id === etablissementSelectionne.id ||
          favorite.slug === etablissementSelectionne.slug,
      )
    : false;

  const etablissementsTries = useMemo(
    () =>
      [...displayedEtablissements].sort(
        (a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity),
      ),
    [displayedEtablissements],
  );

  const isLoading =
    positionLoading || (etablissementsLoading && !etablissements.length);

  const showErrorState =
    !positionLoading && !etablissementsLoading && !!etablissementsError;

  const showEmptyState =
    !positionLoading &&
    !etablissementsLoading &&
    !etablissementsError &&
    !!searchLocation &&
    displayedEtablissements.length === 0;

  const searchBar = (
    <SearchBar
      onSelectSuggestion={handleSuggestionSelect}
      onFilterChange={handleFilterChange}
      selectedVertical={selectedVertical}
      onVerticalChange={handleVerticalChange}
      verticalCounts={verticalCounts}
      cuisines={cuisines}
      selectedCuisine={selectedCuisine}
      currentLocation={searchLocation}
      onLeadingPress={() =>
        setModeAffichage((mode) => (mode === "carte" ? "liste" : "carte"))
      }
      leadingBadge={displayedEtablissements.length}
      leadingSelected={modeAffichage === "liste"}
      onMoodPress={handleOpenMood}
      topOffset={insets.top + 16}
    />
  );

  return (
    <View className="flex-1">
      <BlurTargetView
        ref={blurTargetRef}
        pointerEvents={moodOuvert ? "none" : "auto"}
        style={{ flex: 1 }}
      >
        <CarteView
          ref={carteRef}
          etablissements={displayedEtablissements}
          userLocation={
            itineraireOrigin ??
            developmentLocationCoords ??
            (positionLoading || positionError ? null : coords)
          }
          itineraireGeoJSON={itineraireGeoJSON}
          selectedEtablissementId={etablissementSelectionne?.id}
          controlsBottom={etablissementSelectionne ? 280 : 112}
          onRecenter={() => void handleRecentrer()}
          onEtablissementSelect={handleEtablissementSelect}
          onMapPress={() => {
            setEtablissementSelectionne(null);
            setItineraireGeoJSON(null);
            setItineraireOrigin(null);
          }}
          onViewportChange={setCentreEnAttente}
        />

        {modeAffichage === "carte" && searchBar}

        {/* Badge filtre Mood actif */}
        {isMoodActive && modeAffichage === "carte" && (
          <View
            className="absolute left-4 right-4 z-20 flex-row items-center justify-between rounded-full bg-[#14532D] px-4 py-2.5 shadow-md"
            style={{
              top: insets.top + (selectedCuisine ? 168 : 126),
            }}
          >
            <View className="flex-1 flex-row items-center gap-2 mr-2">
              <Sparkles size={16} color="#FBBF24" />
              <Text className="text-xs font-bold text-white" numberOfLines={1}>
                Mood : {activeMood?.label ?? activeMoodQuery}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Effacer le filtre Mood"
              onPress={() => {
                setActiveMood(null);
                setActiveMoodQuery(null);
              }}
              hitSlop={8}
              className="rounded-full bg-white/20 p-1"
            >
              <X size={14} color="#FFFFFF" strokeWidth={2.5} />
            </Pressable>
          </View>
        )}

        {positionError && modeAffichage === "carte" && (
          <Pressable
            onPress={handleExplorerAbidjan}
            className="absolute left-5 z-20 flex-row items-center gap-2 rounded-full border border-warning/30 bg-white px-3 py-2"
            style={{
              top: insets.top + (isMoodActive ? 186 : 148),
              boxShadow: "0 5px 16px rgba(17, 24, 39, 0.12)",
            }}
            accessibilityRole="button"
            accessibilityLabel="Explorer Abidjan sans utiliser la localisation"
          >
            <MapPinOff size={16} color="#CA8A04" />
            <Text className="text-xs font-bold text-ink-900">
              Position indisponible
            </Text>
            <Text className="text-xs font-bold text-brand-800">
              Explorer Abidjan
            </Text>
          </Pressable>
        )}

        {centreEnAttente && modeAffichage === "carte" && (
          <Pressable
            onPress={handleRechercherZone}
            accessibilityRole="button"
            accessibilityLabel="Rechercher les établissements dans cette zone"
            className="absolute left-1/2 z-20 -translate-x-1/2 flex-row items-center gap-2 rounded-full bg-green-900 px-4 py-3"
            style={{
              top:
                insets.top +
                (positionError
                  ? 206
                  : isMoodActive
                    ? 186
                    : 146),
            }}
          >
            <Layers3 size={16} color="#FFFFFF" />
            <Text className="text-sm font-bold text-white">
              Rechercher dans cette zone
            </Text>
          </Pressable>
        )}

        {/* Aperçu d'un établissement sélectionné (restaurant ou résidence) */}
        {etablissementSelectionne && modeAffichage === "carte" && (
          <View
            key={etablissementSelectionne.id}
            className="absolute left-4 right-4 z-20"
            style={{ bottom: insets.bottom + 92 }}
          >
            <AnimatedEtablissementMapCard
              etablissement={etablissementSelectionne}
              onItineraire={handleMapCardItinerary}
              onOpen={handleVoirEtablissement}
              onClose={() => setEtablissementSelectionne(null)}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isEtablissementSelectionneFavori}
            />
          </View>
        )}

        {modeAffichage === "carte" && showErrorState && (
          <View
            className="absolute left-4 right-4 items-center rounded-2xl bg-white p-6 shadow-sm"
            style={{ bottom: insets.bottom + 112 }}
          >
            <GlobeOff size={48} color="#7f1d1d" className="mb-3" />
            <Text className="mb-2 text-[17px] font-bold text-ink-900">
              Chargement impossible
            </Text>
            <Text className="mb-4 text-center text-[13px] leading-[18px] text-ink-600">
              Nous n&apos;avons pas pu récupérer les établissements autour de
              vous. Vérifiez votre connexion.
            </Text>
            <TouchableOpacity
              className="min-h-[44px] justify-center rounded-[10px] bg-green-900 px-5 py-3"
              onPress={() => refetchEtablissements()}
              accessibilityRole="button"
              accessibilityLabel="Réessayer le chargement des établissements"
            >
              <Text className="text-sm font-bold text-white">Réessayer</Text>
            </TouchableOpacity>
          </View>
        )}

        {modeAffichage === "carte" && showEmptyState && (
          <View
            className="absolute left-4 right-4 items-center rounded-2xl bg-white p-6 shadow-sm"
            style={{ bottom: insets.bottom + 112 }}
          >
            <SearchX size={48} color="#7f1d1d" className="mb-3" />
            <Text className="mb-2 text-[17px] font-bold text-ink-900">
              {isMoodActive
                ? "Aucun lieu trouvé pour ce mood"
                : selectedVertical !== "tous"
                  ? `Aucun ${getVerticalDefinition(selectedVertical).labelSingular.toLowerCase()} ici`
                  : "Aucun établissement ici"}
            </Text>
            <Text className="mb-4 text-center text-[13px] leading-[18px] text-ink-600">
              {isMoodActive
                ? "Essayez un autre mot-clé ou réinitialisez le filtre pour voir tous les établissements."
                : selectedVertical !== "tous"
                  ? getVerticalDefinition(selectedVertical).emptyMessage
                  : "Aucun établissement n'est référencé autour de cette position."}
            </Text>
            <TouchableOpacity
              className="min-h-[44px] justify-center rounded-[10px] bg-green-900 px-5 py-3"
              onPress={
                isMoodActive
                  ? () => {
                      setActiveMood(null);
                      setActiveMoodQuery(null);
                    }
                  : selectedVertical !== "tous"
                    ? () => setSelectedVertical("tous")
                    : handleExplorerAbidjan
              }
              accessibilityRole="button"
              accessibilityLabel={
                isMoodActive
                  ? "Réinitialiser le filtre mood"
                  : selectedVertical !== "tous"
                    ? "Afficher tous les établissements"
                    : "Explorer les établissements d’Abidjan"
              }
            >
              <Text className="text-sm font-bold text-white">
                {isMoodActive
                  ? "Réinitialiser le filtre"
                  : selectedVertical !== "tous"
                    ? "Afficher tous les établissements"
                    : "Explorer Abidjan"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {isLoading && (
          <View className="absolute inset-0 items-center justify-center bg-white/50">
            <ActivityIndicator size="large" color="#14532d" />
          </View>
        )}
      </BlurTargetView>

      {/* Mode Liste */}
      {modeAffichage === "liste" && (
        <View className="absolute inset-0">
          <BlurView
            blurMethod={
              process.env.EXPO_OS === "android"
                ? "dimezisBlurView"
                : undefined
            }
            blurReductionFactor={2}
            blurTarget={blurTargetRef}
            intensity={MOOD_BLUR_INTENSITY}
            style={StyleSheet.absoluteFill}
            tint="light"
          />
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: MOOD_SOFT_VEIL_COLOR },
            ]}
          />
          <FlatList
            data={etablissementsTries}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            renderItem={({ item }) => (
              <EtablissementMapCard
                etablissement={item}
                compact={true}
                onPress={handleVoirEtablissement}
              />
            )}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={{
              paddingTop: insets.top + (selectedCuisine ? 190 : 152),
              paddingHorizontal: 16,
              paddingBottom: insets.bottom + 126,
              gap: 12,
            }}
            ListHeaderComponent={
              <View className="mb-1">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-2xl font-extrabold text-ink-900">
                      Autour de vous
                    </Text>
                    <Text className="mt-1 text-sm text-ink-500">
                      {displayedEtablissements.length}{" "}
                      {selectedVertical === "tous"
                        ? `établissement${displayedEtablissements.length > 1 ? "s" : ""}`
                        : getVerticalDefinition(selectedVertical)[
                            displayedEtablissements.length > 1
                              ? "labelPlural"
                              : "labelSingular"
                          ].toLowerCase()}
                      {isMoodActive
                        ? ` • ${activeMood?.label ?? activeMoodQuery}`
                        : ""}
                    </Text>
                  </View>
                  {isMoodActive && (
                    <Pressable
                      onPress={() => {
                        setActiveMood(null);
                        setActiveMoodQuery(null);
                      }}
                      className="rounded-full bg-surface-100 px-3 py-1.5"
                    >
                      <Text className="text-xs font-semibold text-ink-700">
                        Effacer mood
                      </Text>
                    </Pressable>
                  )}
                </View>
                {positionError && (
                  <Pressable
                    onPress={handleExplorerAbidjan}
                    accessibilityRole="button"
                    accessibilityLabel="Explorer Abidjan sans utiliser la localisation"
                    className="mt-3 flex-row items-center gap-3 rounded-2xl border border-warning/30 bg-white px-3 py-3"
                  >
                    <MapPinOff size={18} color="#CA8A04" />
                    <View className="min-w-0 flex-1">
                      <Text className="text-xs font-bold text-ink-900">
                        Localisation requise
                      </Text>
                      <Text className="mt-0.5 text-[11px] text-ink-600">
                        Vous pouvez quand même consulter les établissements réels.
                      </Text>
                    </View>
                    <Text className="text-xs font-bold text-brand-800">
                      Explorer Abidjan
                    </Text>
                  </Pressable>
                )}
              </View>
            }
            showsVerticalScrollIndicator={false}
          />
          {searchBar}
        </View>
      )}

      {/* Bascule Liste / Carte (Pill flottante centrale) */}
      {!moodOuvert && (
        <Pressable
          onPress={() =>
            setModeAffichage((mode) => (mode === "carte" ? "liste" : "carte"))
          }
          accessibilityRole="button"
          accessibilityLabel={
            modeAffichage === "carte"
              ? "Passer en vue liste"
              : "Passer en vue carte"
          }
          className="absolute left-1/2 z-20 -translate-x-1/2 flex-row items-center gap-2 rounded-full bg-white px-5 py-3 shadow-lg"
          style={{
            bottom:
              modeAffichage === "carte" && etablissementSelectionne
                ? insets.bottom + 260
                : insets.bottom + 92,
          }}
        >
          {modeAffichage === "carte" ? (
            <>
              <List size={18} color="#111827" />
              <Text className="text-sm font-bold text-ink-900">
                Liste ({displayedEtablissements.length})
              </Text>
            </>
          ) : (
            <>
              <Map size={18} color="#111827" />
              <Text className="text-sm font-bold text-ink-900">Carte</Text>
            </>
          )}
        </Pressable>
      )}

      {/* Bouton recentrer circulaire en bas à gauche */}
      {!moodOuvert && modeAffichage === "carte" && (
        <TouchableOpacity
          className="absolute left-4 z-20 h-12 w-12 items-center justify-center rounded-full bg-white shadow-md"
          style={{
            bottom: etablissementSelectionne
              ? insets.bottom + 260
              : insets.bottom + 92,
          }}
          onPress={() => void handleRecentrer()}
          accessibilityRole="button"
          accessibilityLabel="Recentrer sur ma position"
        >
          <LocateFixed size={22} color="black" />
        </TouchableOpacity>
      )}

      {/* Expérience Mood */}
      <MoodOverlay
        visible={moodOuvert}
        onClose={handleCloseMood}
        locationLabel={__DEV__ ? moodLocation.label : "Ma position"}
        locationOptions={
          __DEV__
            ? DEVELOPMENT_LOCATIONS.map(({ id, label }) => ({ id, label }))
            : undefined
        }
        selectedLocationId={__DEV__ ? moodLocation.id : undefined}
        onLocationSelect={
          __DEV__ ? handleDevelopmentLocationSelect : undefined
        }
        onLocationRefresh={
          __DEV__ ? undefined : () => void handleRecentrer()
        }
        locationRefreshing={__DEV__ ? false : positionLoading}
        blurTarget={blurTargetRef}
        onMoodSelect={(moodId, label) => {
          setActiveMood({ id: moodId, label });
          setActiveMoodQuery(null);
        }}
        onSearchSubmit={(text) => {
          setActiveMoodQuery(text);
          setActiveMood(null);
        }}
        activeMoodId={activeMood?.id}
      />
    </View>
  );
}
