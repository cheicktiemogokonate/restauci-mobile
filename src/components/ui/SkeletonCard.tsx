import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { Dimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 92;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export const SkeletonCard: React.FC = () => {
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

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View
      className="mx-4 mb-2.5 rounded-2xl overflow-hidden bg-white relative"
      style={{ height: CARD_HEIGHT }}
    >
      <View className="flex-row p-3" style={{ height: CARD_HEIGHT }}>
        <View className="w-18 h-18 rounded-2.5 bg-ink-200 mr-3" />
        <View className="flex-1 justify-center gap-1.5">
          <View className="h-3.5 w-3/5 bg-ink-200 rounded-1.5" />
          <View className="h-3.5 w-9/10 bg-ink-100 rounded-1.5" />
          <View className="h-3 w-2/5 bg-ink-200 rounded-1.5" />
        </View>
      </View>
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
    </View>
  );
};

export default SkeletonCard;
