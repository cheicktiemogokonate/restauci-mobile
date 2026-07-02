import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
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
      false
    );
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.imagePlaceholder} />
        <View style={styles.content}>
          <View style={styles.lineShort} />
          <View style={styles.lineLong} />
          <View style={styles.lineMedium} />
        </View>
      </View>
      <AnimatedLinearGradient
        colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.shimmer, shimmerStyle]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    height: CARD_HEIGHT,
    position: "relative",
  },
  card: {
    flexDirection: "row",
    padding: 10,
    height: CARD_HEIGHT,
  },
  imagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: "#e5e7eb",
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    gap: 6,
  },
  lineShort: {
    height: 14,
    width: "60%",
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
  },
  lineLong: {
    height: 14,
    width: "90%",
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
  },
  lineMedium: {
    height: 12,
    width: "40%",
    backgroundColor: "#e5e7eb",
    borderRadius: 6,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_WIDTH * 0.6,
    height: CARD_HEIGHT,
  },
});

export default SkeletonCard;