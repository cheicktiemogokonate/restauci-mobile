import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 92;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * Une seule boucle d'animation partagée par toutes les cartes affichées.
 * Évite N timers Reanimated quand on rend une liste de skeletons.
 */
function useShimmer() {
  const translateX = useSharedValue(-CARD_WIDTH);

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(SCREEN_WIDTH, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [translateX]);

  return translateX;
}

function Shimmer({ translateX }: { translateX: SharedValue<number> }) {
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <AnimatedLinearGradient
      colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[
        {
          position: "absolute",
          top: 0,
          left: 0,
          width: CARD_WIDTH * 0.6,
          height: CARD_HEIGHT,
        },
        shimmerStyle,
      ]}
    />
  );
}

function SkeletonCardBody({
  translateX,
}: {
  translateX: SharedValue<number>;
}) {
  return (
    <View
      className="mx-4 mb-2.5 rounded-2xl overflow-hidden bg-white relative"
      style={{ height: CARD_HEIGHT }}
    >
      <View className="flex-row p-3" style={{ height: CARD_HEIGHT }}>
        <View className="w-[72px] h-[72px] rounded-xl bg-ink-200 mr-3" />
        <View className="flex-1 justify-center gap-1.5">
          <View className="h-3.5 w-3/5 bg-ink-200 rounded-md" />
          <View className="h-3.5 w-[90%] bg-ink-100 rounded-md" />
          <View className="h-3 w-2/5 bg-ink-200 rounded-md" />
        </View>
      </View>
      <Shimmer translateX={translateX} />
    </View>
  );
}

/** Carte isolée : porte sa propre boucle d'animation. */
export const SkeletonCard: React.FC = () => {
  const translateX = useShimmer();
  return <SkeletonCardBody translateX={translateX} />;
};

/** Liste de cartes : une seule boucle d'animation pour tout le groupe. */
export const SkeletonCardList: React.FC<{ count?: number }> = ({
  count = 6,
}) => {
  const translateX = useShimmer();

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCardBody key={i} translateX={translateX} />
      ))}
    </>
  );
};

export default SkeletonCard;
