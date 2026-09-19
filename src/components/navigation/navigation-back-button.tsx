import { ChevronLeft } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

interface NavigationBackButtonProps {
  accessibilityLabel?: string;
  onPress: () => void;
}

export function NavigationBackButton({
  accessibilityLabel = "Revenir à l’écran précédent",
  onPress,
}: NavigationBackButtonProps) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={12}
      onPress={onPress}
      style={styles.button}
    >
      <ChevronLeft color="#111111" size={25} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.78)",
    borderColor: "rgba(17,17,17,0.1)",
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
});
