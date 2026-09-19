import * as Haptics from "expo-haptics";
import { memo, useCallback } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface RestaurantMenuCategoryFilterProps {
  categories: { id: string; nom: string }[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
}

export const RestaurantMenuCategoryFilter = memo(
  function RestaurantMenuCategoryFilter({
    categories,
    selectedCategory,
    onSelect,
  }: RestaurantMenuCategoryFilterProps) {
    const handleSelect = useCallback(
      (categoryId: string | null) => {
        void Haptics.selectionAsync();
        onSelect(categoryId);
      },
      [onSelect],
    );

    return (
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: selectedCategory === null }}
            activeOpacity={0.82}
            onPress={() => handleSelect(null)}
            style={[
              styles.category,
              selectedCategory === null
                ? styles.categorySelected
                : styles.categoryIdle,
            ]}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.label,
                selectedCategory === null
                  ? styles.labelSelected
                  : styles.labelIdle,
              ]}
            >
              Tout
            </Text>
          </TouchableOpacity>

          {categories.map((category) => {
            const isSelected = selectedCategory === category.id;

            return (
              <TouchableOpacity
                key={category.id}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                activeOpacity={0.82}
                onPress={() => handleSelect(category.id)}
                style={[
                  styles.category,
                  isSelected ? styles.categorySelected : styles.categoryIdle,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    isSelected ? styles.labelSelected : styles.labelIdle,
                  ]}
                >
                  {category.nom}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  content: {
    gap: 8,
    paddingHorizontal: 18,
  },
  category: {
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 17,
  },
  categorySelected: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  categoryIdle: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E3E3DF",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 18,
  },
  labelSelected: {
    color: "#FFFFFF",
  },
  labelIdle: {
    color: "#525256",
  },
});
