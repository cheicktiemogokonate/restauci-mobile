import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useGeoSearch } from '@/hooks/useGeoSearch';
import type { Suggestion } from '@/types';

// ============================================
// Composant SearchBar — recherche géographique
// ============================================
interface SearchBarProps {
  onSelectSuggestion: (lat: number, lon: number) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectSuggestion }) => {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: suggestions, isLoading } = useGeoSearch(query);

  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
    setShowSuggestions(text.trim().length > 2);
  }, []);

  const handleSelect = useCallback(
    (item: Suggestion) => {
      onSelectSuggestion(item.lat, item.lon);
      setQuery(item.label);
      setShowSuggestions(false);
    },
    [onSelectSuggestion]
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowSuggestions(false), 200);
  }, []);

  const handleFocus = useCallback(() => {
    if (query.trim().length > 2) {
      setShowSuggestions(true);
    }
  }, [query]);

  const renderItem = useCallback(
    ({ item }: { item: Suggestion }) => (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.6}
      >
        <Text style={styles.suggestionIcon}>📍</Text>
        <Text style={styles.suggestionLabel} numberOfLines={1}>
          {item.label}
        </Text>
      </TouchableOpacity>
    ),
    [handleSelect]
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.input}
          placeholder="Rechercher un lieu..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={handleChangeText}
          onBlur={handleBlur}
          onFocus={handleFocus}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {showSuggestions && suggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => `${item.label}-${index}`}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            scrollEnabled
            style={styles.suggestionsList}
          />
        </View>
      )}

      {showSuggestions && suggestions && suggestions.length === 0 && !isLoading && (
        <View style={styles.suggestionsContainer}>
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>Aucun résultat</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 48,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    paddingVertical: 0,
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  suggestionsList: {
    flexGrow: 0,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    fontSize: 14,
    marginRight: 8,
  },
suggestionLabel: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  noResults: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  noResultsText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default SearchBar;
