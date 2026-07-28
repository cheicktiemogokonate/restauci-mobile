import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image, ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCallback } from "react";

const ONBOARDING_SEEN_KEY = "onboarding_seen_v1";

export default function OnboardingScreen() {
  const router = useRouter();

  // Vérifie au chargement si l'onboarding a été vu
  // En React Native, localStorage n'est pas disponible, donc on affiche l'onboarding.
  // En web, on peut utiliser localStorage pour éviter de le rejouer.
  const isSeen = false; // toujours afficher en RN ; localStorage basé en web

  const handleComplete = useCallback(() => {
    try {
      localStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    } catch {
      // localStorage non disponible (React Native)
    }
    router.replace("/(tabs)");
  }, [router]);

  if (isSeen) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-ink-50">
      <ImageBackground
        source={require("../../assets/images/food2.jpeg")}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      >
        <View className="flex-1 px-6 pt-4">
          {/* Logo */}
          <View className="-mt-3">
            <View className="h-10 w-full mb-4">
              <Image
                source={require("@/assets/images/logo-toutci2.png")}
                contentFit="contain"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          </View>
          {/* Headlines */}
          <View className="mb-6 z-10">
            <Text className="text-3xl leading-[48px] font-extrabold text-brand-500">
              Vos meilleurs{"\n"}établissement,{"\n"}tout{" "}
              <Text className="text-brand-500">près d&apos;ici.</Text>
            </Text>
          </View>

          <Text className="text-lg text-brand-500 mb-12 pr-10 font-medium z-10">
            Trouvez les meilleurs établissement{"\n"}autour de vous, en quelques
            secondes.
          </Text>

          {/* Image and Badges */}
          <View className="flex-1 justify-center items-center mt-4">
            <View className="w-[300px] h-[300px] rounded-full justify-center items-center">
              {/* Top Left Badge — brand voice, not fake metric */}
              <View className="absolute -left-4 top-10 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-ink-200">
                <FontAwesome5 name="walking" size={18} color="#457b3b" />
                <View className="ml-2">
                  <Text className="text-sm font-bold text-ink-900">
                    Livraison
                  </Text>
                  <Text className="text-xs text-ink-500">locale</Text>
                </View>
              </View>

              {/* Right Badge */}
              <View className="absolute -right-12 top-14 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-ink-200">
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={20}
                  color="#457b3b"
                />
                <View className="ml-2">
                  <Text className="text-sm font-bold text-ink-900">Ouvert</Text>
                  <Text className="text-xs text-ink-500">à Bouaké</Text>
                </View>
              </View>

              {/* Bottom Left Badge — cuisine identity, not a vanity rating */}
              <View className="absolute -left-2 bottom-12 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-ink-200">
                <MaterialCommunityIcons
                  name="silverware-fork-knife"
                  size={20}
                  color="#457b3b"
                />
                <View className="ml-2">
                  <Text className="text-sm font-bold text-ink-900">
                    Cuisine
                  </Text>
                  <Text className="text-xs text-ink-500">ivoirienne</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pagination Dots */}
          <View className="flex-row justify-center items-center mt-12 mb-8">
            <View className="w-6 h-2 rounded-full bg-brand-500 mx-1" />
            <View className="w-2 h-2 rounded-full bg-green-100 mx-1" />
            <View className="w-2 h-2 rounded-full bg-green-100 mx-1" />
          </View>

          {/* Actions */}
          <View className="mb-4">
            <TouchableOpacity
              className="bg-brand-700 py-4 rounded-full items-center active:opacity-80"
              onPress={handleComplete}
              accessibilityRole="button"
              accessibilityLabel="Commencer la découverte de Toutci"
            >
              <Text className="text-white text-lg font-semibold">
                Commencer
              </Text>
            </TouchableOpacity>
          </View>
          <View className="items-center mb-6">
            <TouchableOpacity
              className="p-2 active:opacity-60"
              onPress={handleComplete}
              accessibilityRole="button"
              accessibilityLabel="Passer directement à lapplication"
            >
              <Text className="text-ink-400 text-base font-medium">
                Passer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}