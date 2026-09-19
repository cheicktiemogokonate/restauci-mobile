import { useGeoSearch } from "@/hooks/useGeoSearch";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import type {
  DiscoveryLocation,
  TypeEtablissement,
} from "@/types/etablissement";
import {
  LIBELLES_TYPE_ETABLISSEMENT,
  TYPE_ETABLISSEMENT_DEFAUT,
} from "@/types/etablissement";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Hash,
  Home,
  Map as MapIcon,
  MapPin,
  Search,
  UtensilsCrossed,
} from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// ============================================
// Composant SearchBar — recherche géographique
// ============================================
import {
  VERTICAL_FILTER_OPTIONS,
  type VerticalFilter,
} from "@/constants/verticals";

interface SearchBarProps {
  onSelectSuggestion: (
    lat: number,
    lon: number,
    etablissementId?: string,
  ) => void;
  onFilterChange?: (cuisine: string | null) => void;
  selectedVertical?: VerticalFilter;
  onVerticalChange?: (vertical: VerticalFilter) => void;
  verticalCounts?: Record<VerticalFilter, number>;
  /** Catégories de cuisine réellement présentes autour de l'utilisateur. */
  cuisines?: string[];
  selectedCuisine?: string | null;
  currentLocation: DiscoveryLocation | null;
  /** Action de tête réutilisable, par exemple l'alternance map/liste. */
  onLeadingPress?: () => void;
  leadingBadge?: number;
  leadingSelected?: boolean;
  /** Ouvre l'expérience Mood à la place de la recherche classique. */
  onMoodPress?: () => void;
  /** Réservé aux verticales à venir (résidences, événements). */
  typeEtablissement?: TypeEtablissement;
  topOffset?: number;
}

type CombinedSuggestion =
  | { type: "geo"; label: string; lat: number; lon: number }
  | {
      type: "etablissement" | "restaurant";
      id: string;
      label: string;
      lat: number;
      lon: number;
      verticalType?: TypeEtablissement;
    };

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectSuggestion,
  onFilterChange,
  selectedVertical = "tous",
  onVerticalChange,
  verticalCounts,
  cuisines = [],
  selectedCuisine = null,
  currentLocation,
  onLeadingPress,
  leadingBadge = 0,
  leadingSelected = false,
  onMoodPress,
  typeEtablissement = TYPE_ETABLISSEMENT_DEFAUT,
  topOffset = 56,
}) => {
  const libelles = LIBELLES_TYPE_ETABLISSEMENT[typeEtablissement];
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const {
    data: geoSuggestions,
    error: geoError,
    isLoading: geoLoading,
  } = useGeoSearch(query);
  const {
    data: restaurantSuggestions,
    error: restaurantError,
    isLoading: restaurantLoading,
  } = useRestaurantSearch(query, selectedCuisine, currentLocation);

  const isLoading = geoLoading || restaurantLoading;
  const hasSearchError = Boolean(geoError || restaurantError);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions: CombinedSuggestion[] = [
    ...(restaurantSuggestions || []),
    ...(geoSuggestions || []).map((s) => ({ ...s, type: "geo" as const })),
  ];
  const cuisineOptions = useMemo(
    () =>
      selectedCuisine && !cuisines.includes(selectedCuisine)
        ? [selectedCuisine, ...cuisines]
        : cuisines,
    [cuisines, selectedCuisine],
  );

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setShowSuggestions(text.trim().length > 2);
  }, []);

  const handleSelect = useCallback(
    (item: CombinedSuggestion) => {
      onSelectSuggestion(
        item.lat,
        item.lon,
        item.type !== "geo" ? item.id : undefined,
      );
      setQuery(item.label);
      setShowSuggestions(false);
    },
    [onSelectSuggestion],
  );

  const handleSelectCategory = useCallback((category: string) => {
    const newCategory = selectedCuisine === category ? null : category;
    if (onFilterChange) {
      onFilterChange(newCategory);
    }
  }, [selectedCuisine, onFilterChange]);

  const handleBlur = useCallback(() => {
    blurTimeoutRef.current = setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    if (query.trim().length > 2) {
      setShowSuggestions(true);
    }
  }, [query]);

  useEffect(
    () => () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: CombinedSuggestion }) => (
      <TouchableOpacity
        className="flex-row items-center border-b border-ink-100 px-4 py-3"
        onPress={() => handleSelect(item)}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityLabel={`Choisir ${item.label}`}
      >
        {item.type === "geo" ? (
          <MapPin size={18} color="theme.ink700" />
        ) : item.verticalType === "residence" ? (
          <Home size={18} color="theme.green900" />
        ) : (
          <UtensilsCrossed size={18} color="theme.ink700" />
        )}
        <Text className="ml-3 mr-2 flex-1 text-sm text-ink-700" numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    ),
    [handleSelect],
  );

  return (
    <View
      style={{
        position: "absolute",
        top: topOffset,
        right: 20,
        left: 20,
        zIndex: 30,
      }}
    >
      {onMoodPress ? (
        <TouchableOpacity
          onPress={onMoodPress}
          activeOpacity={0.82}
          accessibilityRole="button"
          accessibilityLabel="Ouvrir la recherche Mood"
          className="h-16 flex-row items-center justify-center bg-white px-5"
          style={{
            borderRadius: 32,
            borderCurve: "continuous",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.72)",
            boxShadow: "0 10px 28px rgba(17, 24, 39, 0.13)",
          }}
        >
          <Search size={23} color="theme.ink900" strokeWidth={1.9} />
          <Text className="ml-3 text-[16px] font-medium text-ink-700">
            Rechercher...
          </Text>
        </TouchableOpacity>
      ) : (
        <View
          className="h-16 flex-row items-center bg-white px-5"
          style={{
            borderRadius: 32,
            borderCurve: "continuous",
            boxShadow: "0 8px 24px rgba(17, 24, 39, 0.14)",
          }}
        >
          <Search size={23} color="theme.ink900" strokeWidth={2} />
          <TextInput
            className="ml-3 flex-1 text-base text-ink-900"
            placeholder={`Rechercher ${libelles.pluriel}, une adresse...`}
            placeholderTextColor="theme.ink500"
            value={query}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            onFocus={handleFocus}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCorrect={false}
            accessibilityLabel="Rechercher un établissement ou une adresse"
            maxLength={200}
          />
          {isLoading && <ActivityIndicator size="small" color="theme.ink900" />}
        </View>
      )}

      <View className="mt-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ alignItems: "center", gap: 10, paddingRight: 24 }}
        >
          {onLeadingPress && (
            <TouchableOpacity
              onPress={onLeadingPress}
              activeOpacity={0.74}
              accessibilityRole="button"
              accessibilityLabel={
                leadingSelected
                  ? "Revenir à la map"
                  : "Afficher les établissements en liste"
              }
              className="h-12 w-12 items-center justify-center rounded-full bg-black"
              style={{ boxShadow: "0 4px 14px rgba(17, 24, 39, 0.18)" }}
            >
              {leadingSelected ? (
                <MapIcon size={22} color="#FFFFFF" />
              ) : (
                <Hash size={22} color="#FFFFFF" />
              )}
              {leadingBadge > 0 && (
                <View className="absolute -bottom-1 -right-1 min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-ink-700 px-1">
                  <Text
                    className="text-[10px] font-bold text-white"
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {leadingBadge > 99 ? "99+" : leadingBadge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {/* Filtres de verticales unifiées */}
          {VERTICAL_FILTER_OPTIONS.map((option) => {
            const isSelected = selectedVertical === option.id;
            const count = verticalCounts?.[option.id];
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => onVerticalChange?.(option.id)}
                activeOpacity={0.74}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`Filtrer par ${option.label}`}
                className={`h-12 flex-row items-center justify-center rounded-full border px-4 ${
                  isSelected
                    ? "border-black bg-black"
                    : "border-white bg-white"
                }`}
                style={{ boxShadow: "0 4px 14px rgba(17, 24, 39, 0.10)" }}
              >
                <Text
                  className={`text-[15px] font-semibold ${
                    isSelected ? "text-white" : "text-ink-900"
                  }`}
                >
                  {option.label}
                </Text>
                {typeof count === "number" && (
                  <View
                    className={`ml-1.5 h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 ${
                      isSelected ? "bg-white/25" : "bg-ink-100"
                    }`}
                  >
                    <Text
                      className={`text-[11px] font-bold ${
                        isSelected ? "text-white" : "text-ink-700"
                      }`}
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* Filtres de cuisine lorsque pertinent */}
          {selectedVertical !== "residence" &&
            cuisineOptions.map((category) => {
              const isSelected = selectedCuisine === category;
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => handleSelectCategory(category)}
                  activeOpacity={0.74}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Filtrer par ${category}`}
                  className={`h-12 justify-center rounded-full border px-5 ${
                    isSelected
                      ? "border-black bg-black"
                      : "border-white bg-white"
                  }`}
                  style={{ boxShadow: "0 4px 14px rgba(17, 24, 39, 0.10)" }}
                >
                  <Text
                    className={`text-[15px] font-semibold ${
                      isSelected ? "text-white" : "text-ink-900"
                    }`}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
      </View>

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <View
          className="mt-2 max-h-56 overflow-hidden bg-white"
          style={{
            borderRadius: 22,
            borderCurve: "continuous",
            boxShadow: "0 8px 24px rgba(17, 24, 39, 0.14)",
          }}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) =>
              item.type === "restaurant"
                ? `restaurant-${item.id}`
                : `geo-${item.lat}-${item.lon}-${item.label}`
            }
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            scrollEnabled
            scrollEventThrottle={0}
          />
        </View>
      )}

      {showSuggestions &&
        suggestions &&
        suggestions.length === 0 &&
        !isLoading && (
          <View
            className="mt-2 overflow-hidden bg-white"
            style={{
              borderRadius: 22,
              borderCurve: "continuous",
              boxShadow: "0 8px 24px rgba(17, 24, 39, 0.14)",
            }}
          >
            <View className="px-3.5 py-3">
              <Text className="text-sm text-ink-400 text-center">
                {hasSearchError
                  ? "Recherche momentanément indisponible"
                  : "Aucun résultat"}
              </Text>
            </View>
          </View>
        )}
    </View>
  );
};

export default SearchBar;
