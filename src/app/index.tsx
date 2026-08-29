import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image, ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import { Footprints, Store, Utensils } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ONBOARDING_SEEN_KEY = "onboarding_seen_v1";

export default function OnboardingScreen() {
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    let isMounted = true;

    AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
      .then((value) => {
        if (!isMounted) return;

        if (value === "true") {
          router.replace("/(tabs)");
          return;
        }

        setIsCheckingOnboarding(false);
      })
      .catch(() => {
        if (isMounted) {
          // En cas d'indisponibilité du stockage, laisser l'utilisateur
          // accéder normalement à l'onboarding.
          setIsCheckingOnboarding(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleComplete = useCallback(() => {
    AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true")
      .catch(() => {
        // La navigation reste possible même si le stockage échoue.
      })
      .finally(() => {
        router.replace("/(tabs)");
      });
  }, [router]);

  if (isCheckingOnboarding) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-ink-50">
        <ActivityIndicator size="large" color="#14532d" />
      </SafeAreaView>
    );
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
                source={require("@/assets/images/toutci-logo-transparent.png")}
                contentFit="contain"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          </View>
          {/* Headlines */}
          <View className="mb-6 z-10">
            <Text className="text-3xl leading-[48px] font-extrabold text-brand-900">
              Vos meilleurs{"\n"}établissements,{"\n"}tout{" "}
              <Text className="text-brand-500">près d&apos;ici.</Text>
            </Text>
          </View>

          <Text className="text-lg text-slate-950 mb-12 pr-10 font-medium z-10">
            Trouvez les meilleurs établissements{"\n"}autour de vous, en quelques
            secondes.
          </Text>

          {/* Image and Badges */}
          <View className="flex-1 justify-center items-center mt-4">
            <View className="w-[300px] h-[300px] rounded-full justify-center items-center">
              {/* Top Left Badge — brand voice, not fake metric */}
              <View className="absolute -left-4 top-10 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-ink-200">
                <Footprints size={18} color="#457b3b" />
                <View className="ml-2">
                  <Text className="text-sm font-bold text-ink-900">
                    Livraison
                  </Text>
                  <Text className="text-xs text-ink-500">locale</Text>
                </View>
              </View>

              {/* Right Badge */}
              <View className="absolute -right-12 top-14 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-ink-200">
                <Store size={20} color="#457b3b" />
                <View className="ml-2">
                  <Text className="text-sm font-bold text-ink-900">Tout près</Text>
                  <Text className="text-xs text-ink-500">de chez vous</Text>
                </View>
              </View>

              {/* Bottom Left Badge — cuisine identity, not a vanity rating */}
              <View className="absolute -left-2 bottom-12 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-ink-200">
                <Utensils size={20} color="#457b3b" />
                <View className="ml-2">
                  <Text className="text-sm font-bold text-ink-900">
                    Cuisine
                  </Text>
                  <Text className="text-xs text-ink-500">ivoirienne</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="mb-8 mt-12">
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
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}
