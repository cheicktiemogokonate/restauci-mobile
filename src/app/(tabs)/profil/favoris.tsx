import { useStore } from "@/store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Heart, Trash2 } from "lucide-react-native";
import { Alert, FlatList, Pressable, Text, View } from "react-native";

export default function FavorisScreen() {
  const router = useRouter();
  const favorites = useStore((state) => state.favorites);
  const toggleFavorite = useStore((state) => state.toggleFavorite);

  return (
    <FlatList
      data={favorites}
      keyExtractor={(item) => item.id}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        flexGrow: 1,
        padding: 16,
        paddingBottom: 96,
        gap: 12,
        backgroundColor: "#F9FAFB",
      }}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => router.push(`/restaurant/${item.slug}`)}
          accessibilityRole="button"
          accessibilityLabel={`Voir ${item.nom}`}
          className="flex-row items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3"
          style={{ borderCurve: "continuous" }}
        >
          <View
            className="h-16 w-16 overflow-hidden rounded-2xl bg-ink-100"
            style={{ borderCurve: "continuous" }}
          >
            {item.logoUrl || item.banniereUrl ? (
              <Image
                source={item.logoUrl ?? item.banniereUrl}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center">
                <Heart size={24} color="#14532d" />
              </View>
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-bold text-ink-900">
              {item.nom}
            </Text>
            <Text className="mt-1 text-sm text-brand-800">
              Voir l’établissement
            </Text>
          </View>
          <Pressable
            onPress={(event) => {
              event.stopPropagation();
              void toggleFavorite(item).catch(() => {
                Alert.alert(
                  "Favori non supprimé",
                  "Impossible de mettre à jour les favoris sur l’appareil.",
                );
              });
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Retirer ${item.nom} des favoris`}
            className="h-11 w-11 items-center justify-center rounded-full bg-danger-50"
          >
            <Trash2 size={18} color="#DC2626" />
          </Pressable>
        </Pressable>
      )}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center px-8">
          <Heart size={48} color="#9CA3AF" />
          <Text className="mt-4 text-xl font-bold text-ink-900">
            Aucun favori
          </Text>
          <Text className="mt-2 text-center text-ink-500">
            Ajoutez vos établissements préférés depuis leur fiche.
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)")}
            className="mt-6 rounded-full bg-green-900 px-6 py-4"
          >
            <Text className="font-bold text-white">Explorer la carte</Text>
          </Pressable>
        </View>
      }
    />
  );
}
