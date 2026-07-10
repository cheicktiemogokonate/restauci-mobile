import React, { useCallback } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";

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
  const handleSelectCat = useCallback((id: string) => onSelect(id), [onSelect]);

  return (
    <View className="bg-white py-2.5 border-b border-ink-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        <TouchableOpacity
          className={`px-4 py-2 rounded-full ${selectedCategory === null ? "bg-green-800" : "bg-ink-100"}`}
          onPress={handleSelectAll}
          activeOpacity={0.7}
        >
          <Text
            className={`text-sm font-semibold ${selectedCategory === null ? "text-white" : "text-ink-500"}`}
          >
            Tout
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            className={`px-4 py-2 rounded-full ${selectedCategory === cat.id ? "bg-green-800" : "bg-ink-100"}`}
            onPress={() => handleSelectCat(cat.id)}
            activeOpacity={0.7}
          >
            <Text
              className={`text-sm font-semibold ${selectedCategory === cat.id ? "text-white" : "text-ink-500"}`}
            >
              {cat.nom}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default FiltreCategoriesMobile;
