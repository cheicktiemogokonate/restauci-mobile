import { useGeoSearch } from "@/hooks/useGeoSearch";
import { useRestaurantSearch } from "@/hooks/useRestaurantSearch";
import {
  LIBELLES_TYPE_ETABLISSEMENT,
  TYPE_ETABLISSEMENT_DEFAUT,
  type TypeEtablissement,
} from "@/types/etablissement";
import { Search } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

// ============================================
// Composant SearchBar — recherche géographique
// ============================================
interface SearchBarProps {
  onSelectSuggestion: (
    lat: number,
    lon: number,
    restaurantId?: string,
  ) => void;
  onFilterChange?: (cuisine: string | null) => void;
  /** Catégories de cuisine réellement présentes autour de l'utilisateur. */
  cuisines?: string[];
  selectedCuisine?: string | null;
  /** Réservé aux verticales à venir (résidences, événements). */
  typeEtablissement?: TypeEtablissement;
  topOffset?: number;
}

type CombinedSuggestion =
  | { type: "geo"; label: string; lat: number; lon: number }
  | { type: "restaurant"; id: string; label: string; lat: number; lon: number };


export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectSuggestion,
  onFilterChange,
  cuisines = [],
  selectedCuisine = null,
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
  } = useRestaurantSearch(query, selectedCuisine);

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
        item.type === "restaurant" ? item.id : undefined,
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
        className="flex-row items-center px-3 py-3 border-b border-ink-100"
        onPress={() => handleSelect(item)}
        activeOpacity={0.6}
      >
        <Text className="mr-2 text-base">
          {item.type === "restaurant" ? "🍽️" : "📍"}
        </Text>
        <Text className="flex-1 text-sm text-ink-700 mr-2" numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    ),
    [handleSelect],
  );

  return (
    <View
      style={{ position: "absolute", top: topOffset, left: 16, right: 16, zIndex: 10 }
      }
    >
      <View className="flex-row items-center bg-white rounded-2xl px-3 h-12 shadow-md">
        <Search size={20} color="#000" />
        <TextInput
          className="flex-1 text-base text-ink-900 ml-2"
          placeholder={`${libelles.pluriel.charAt(0).toUpperCase()}${libelles.pluriel.slice(1)}, adresses...`}
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          returnKeyType="search"
          clearButtonMode="while-editing"
          maxLength={200}
        />
      </View>

      {cuisineOptions.length > 0 && (
      <View className="mt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {cuisineOptions.map((category) => {
            const isSelected = selectedCuisine === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => handleSelectCategory(category)}
                className={`mr-2 px-4 py-1.5 rounded-full border ${isSelected ? 'bg-brand-900 border-brand-900' : 'bg-white border-gray-200'
                  } shadow-sm`}
              >
                <Text className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      )}


      {showSuggestions && suggestions && suggestions.length > 0 && (
        <View className="bg-white rounded-2xl mt-1 max-h-48 shadow-md overflow-hidden">
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
          <View className="bg-white rounded-2xl mt-1 shadow-md overflow-hidden">
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
