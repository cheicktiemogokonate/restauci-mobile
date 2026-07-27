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
    <View className="bg-white py-3 border-b border-ink-100">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
      >
        <TouchableOpacity
          className={`mr-2 px-4 py-1.5 rounded-full border ${
            selectedCategory === null
              ? "bg-brand-900 border-brand-900"
              : "bg-white border-gray-200"
          } shadow-sm`}
          onPress={handleSelectAll}
        >
          <Text
            className={`text-sm font-medium ${selectedCategory === null ? "text-white" : "text-gray-700"}`}
          >
            Tout
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            className={`mr-2 px-4 py-1.5 rounded-full border ${
              selectedCategory === cat.id
                ? "bg-brand-900 border-brand-900"
                : "bg-white border-gray-200"
            } shadow-sm`}
            onPress={() => handleSelectCat(cat.id)}
          >
            <Text
              className={`text-sm font-medium ${selectedCategory === cat.id ? "text-white" : "text-gray-700"}`}
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
