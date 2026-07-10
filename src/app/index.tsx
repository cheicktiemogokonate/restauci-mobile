import { FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { Link, useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[ink-100]">
      <ImageBackground
        source={require("../../assets/images/food2.jpeg")}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
      >
        <View className="flex-1 px-6 pt-4">
          {/* Logo */}
          <View className="items-center -mt-8">
            <View className="items-center justify-center h-24 w-full ">
              <Image
                source={require("@/assets/images/logo-restauci.png")}
                resizeMode="contain"
                style={{ width: "100%", height: "100%" }}
              />
            </View>
          </View>
          {/* Headlines */}
          <View className="mb-6 z-10">
            <Text className="text-[40px] leading-[48px] font-extrabold text-[green-900]">
              Vos meilleurs{"\n"}restaurants,{"\n"}tout{" "}
              <Text className="text-[#457b3b]">près d'ici.</Text>
            </Text>
          </View>

          <Text className="text-lg text-[green-900] mb-12 pr-10 font-medium z-10">
            Trouvez les meilleurs restaurants{"\n"}autour de vous, en quelques
            secondes.
          </Text>

          {/* Image and Badges */}
          <View className="flex-1 justify-center items-center mt-4">
            <View className="w-[300px] h-[300px] rounded-full justify-center items-center">
              {/* Top Left Badge */}
              <View
                className="absolute -left-4 top-10 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-gray-100"
                style={styles.shadow}
              >
                <FontAwesome5 name="walking" size={18} color="#457b3b" />
                <View className="ml-2">
                  <Text className="text-sm font-bold text-green-900">
                    3 min
                  </Text>
                  <Text className="text-xs text-gray-500">à pied</Text>
                </View>
              </View>

              {/* Right Badge */}
              <View
                className="absolute -right-12 top-14 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-gray-100"
                style={styles.shadow}
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={20}
                  color="#457b3b"
                />
                <View className="ml-2">
                  <Text className="text-sm font-bold text-green-900">
                    Ouvert
                  </Text>
                  <Text className="text-xs text-gray-500">maintenant</Text>
                </View>
              </View>

              {/* Bottom Left Badge */}
              <View
                className="absolute -left-2 bottom-12 flex-row items-center bg-ink-50 px-3 py-2 rounded-2xl shadow-sm border border-gray-100"
                style={styles.shadow}
              >
                <MaterialCommunityIcons name="star" size={20} color="#457b3b" />
                <View className="ml-2 flex-row items-baseline">
                  <Text className="text-sm font-bold text-green-900 mr-1">
                    4,7
                  </Text>
                  <Text className="text-xs text-gray-500">(320 avis)</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Pagination Dots */}
          <View className="flex-row justify-center items-center mt-12 mb-8">
            <View className="w-6 h-2 rounded-full bg-[#457b3b] mx-1" />
            <View className="w-2 h-2 rounded-full bg-green-100 mx-1" />
            <View className="w-2 h-2 rounded-full bg-green-100 mx-1" />
          </View>

          {/* Actions */}
          <View className="mb-4">
            <Link href="/(tabs)" asChild>
              <TouchableOpacity className="bg-[#386b2a] py-4 rounded-[30px] items-center active:opacity-80">
                <Text className="text-white text-lg font-semibold">
                  Commencer
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View className="items-center mb-6">
            <Link href="/(tabs)" asChild>
              <TouchableOpacity className="p-2 active:opacity-60">
                <Text className="text-gray-500 text-base font-medium">
                  Passer
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#111827",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});
