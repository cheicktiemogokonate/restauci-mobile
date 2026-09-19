import {
  MOOD_BLUR_INTENSITY,
  MOOD_SOFT_VEIL_COLOR,
  MOOD_STATIC_GRADIENT_COLORS,
} from "@/constants/visual-effects";
import { BlurTargetView, BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import { StyleSheet, View } from "react-native";

/** Fond d'application partagé, issu de la direction visuelle du panier. */
export function AppBackdrop() {
  const blurTarget = useRef<View | null>(null);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <BlurTargetView ref={blurTarget} style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={MOOD_STATIC_GRADIENT_COLORS}
          end={{ x: 0.88, y: 1 }}
          start={{ x: 0.08, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </BlurTargetView>
      <BlurView
        blurMethod={
          process.env.EXPO_OS === "android" ? "dimezisBlurView" : undefined
        }
        blurReductionFactor={2}
        blurTarget={blurTarget}
        intensity={MOOD_BLUR_INTENSITY}
        style={StyleSheet.absoluteFill}
        tint="light"
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: MOOD_SOFT_VEIL_COLOR },
        ]}
      />
    </View>
  );
}
