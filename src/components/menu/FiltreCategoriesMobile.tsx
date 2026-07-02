import React, { useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// ============================================
// Composant FiltreCategoriesMobile — filtres
// ============================================
interface FiltreCategoriesMobileProps {
  categories: { id: string; nom: string }[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export const FiltreCategoriesMobile: React.FC<FiltreCategoriesMobileProps> = ({
  categories,
  selectedCategory,
  onSelect,
}) => {
  const handleSelectAll = useCallback(() => onSelect(null), [onSelect]);
  const handleSelectCat = useCallback(
    (id: string) => onSelect(id),
    [onSelect]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <TouchableOpacity
          style={[styles.chip, selectedCategory === null && styles.chipActive]}
          onPress={handleSelectAll}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.chipText,
              selectedCategory === null && styles.chipTextActive,
            ]}
          >
            Tout
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.chip,
              selectedCategory === cat.id && styles.chipActive,
            ]}
            onPress={() => handleSelectCat(cat.id)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                selectedCategory === cat.id && styles.chipTextActive,
              ]}
            >
              {cat.nom}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  chipActive: {
    backgroundColor: '#22c55e',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  chipTextActive: {
    color: '#ffffff',
  },
});

export default FiltreCategoriesMobile;