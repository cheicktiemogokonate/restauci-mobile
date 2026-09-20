import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import {
  MOOD_BLUR_INTENSITY,
  MOOD_SOFT_VEIL_COLOR,
} from "@/constants/visual-effects";
import {
  Camera,
  Check,
  ChevronDown,
  Coffee,
  Heart,
  MapPin,
  RefreshCw,
  Search,
  TreePine,
  type LucideIcon,
} from "lucide-react-native";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Animated,
  BackHandler,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";

import type { MoodType } from "@/hooks/useEtablissements";
import { theme } from "@/constants/theme";

type MoodSuggestion = {
  id: MoodType;
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  backgroundColor: string;
};

const MOOD_SUGGESTIONS: MoodSuggestion[] = [
  {
    id: "calme_discret",
    title: "Matin tranquille & calme",
    description: "Ambiance sereine, discrète, propice à la détente.",
    icon: Coffee,
    iconColor: "#6B3B17",
    backgroundColor: "#F7F0E8",
  },
  {
    id: "belle_vue",
    title: "Belles vues & rooftop",
    description: "Endroits avec panorama remarquable, terrasse ou vue lagune.",
    icon: Camera,
    iconColor: "#8A5B00",
    backgroundColor: "#FFF6DF",
  },
  {
    id: "entre_amis",
    title: "Entre amis & convivial",
    description: "Ambiance festive, barbecue, maquis et moments partagés.",
    icon: TreePine,
    iconColor: "#116B24",
    backgroundColor: "#E4F8E2",
  },
  {
    id: "coup_de_coeur",
    title: "Coups de cœur",
    description: "Les lieux les plus plébiscités et aimés d’ici.",
    icon: Heart,
    iconColor: "#9B555D",
    backgroundColor: "#FCECEE",
  },
];

type MoodOverlayProps = {
  visible: boolean;
  onClose: () => void;
  locationLabel?: string;
  locationOptions?: { id: string; label: string }[];
  selectedLocationId?: string;
  onLocationSelect?: (locationId: string) => void;
  onLocationRefresh?: () => void;
  locationRefreshing?: boolean;
  blurTarget?: RefObject<View | null>;
  onMoodSelect?: (moodId: MoodType, label: string) => void;
  onSearchSubmit?: (query: string) => void;
  activeMoodId?: MoodType | string | null;
};

export function MoodOverlay({
  visible,
  onClose,
  locationLabel = "Ma position",
  locationOptions = [],
  selectedLocationId,
  onLocationSelect,
  onLocationRefresh,
  locationRefreshing = false,
  blurTarget,
  onMoodSelect,
  onSearchSubmit,
  activeMoodId,
}: MoodOverlayProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const reduceMotion = useReducedMotion();
  const [entrance] = useState(() => new Animated.Value(0));
  const [query, setQuery] = useState("");
  const [rendered, setRendered] = useState(visible);
  const [locationMenuOpen, setLocationMenuOpen] = useState(false);
  const hasLocationOptions = locationOptions.length > 0;

  const handleClose = useCallback(() => {
    setLocationMenuOpen(false);
    onClose();
  }, [onClose]);

  const handleLocationPress = useCallback(() => {
    void Haptics.selectionAsync();
    if (hasLocationOptions) {
      setLocationMenuOpen((isOpen) => !isOpen);
      return;
    }
    onLocationRefresh?.();
  }, [hasLocationOptions, onLocationRefresh]);

  const handleLocationSelect = useCallback(
    (locationId: string) => {
      void Haptics.selectionAsync();
      setLocationMenuOpen(false);
      onLocationSelect?.(locationId);
    },
    [onLocationSelect],
  );

  const handleSuggestionPress = useCallback(
    (suggestion: (typeof MOOD_SUGGESTIONS)[number]) => {
      void Haptics.selectionAsync();
      setQuery(suggestion.title);
      onMoodSelect?.(suggestion.id, suggestion.title);
      handleClose();
    },
    [handleClose, onMoodSelect],
  );

  const handleSearchSubmit = useCallback(() => {
    if (query.trim()) {
      void Haptics.selectionAsync();
      onSearchSubmit?.(query.trim());
      handleClose();
    }
  }, [handleClose, onSearchSubmit, query]);

  useEffect(() => {
    if (!visible) return;
    const mountTimer = setTimeout(() => setRendered(true), 0);
    return () => clearTimeout(mountTimer);
  }, [visible]);

  useEffect(() => {
    if (!rendered) return;

    if (!visible) {
      inputRef.current?.blur();
      Keyboard.dismiss();

      const exitAnimation = Animated.timing(entrance, {
        toValue: 0,
        duration: reduceMotion ? 0 : 210,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });
      exitAnimation.start(({ finished }) => {
        if (finished) setRendered(false);
      });

      return () => exitAnimation.stop();
    }

    entrance.setValue(0);
    const entranceTimer = setTimeout(() => {
      if (reduceMotion) {
        entrance.setValue(1);
        return;
      }
      Animated.spring(entrance, {
        toValue: 1,
        damping: 20,
        stiffness: 190,
        mass: 0.9,
        useNativeDriver: true,
      }).start();
    }, 0);

    const focusTimer = setTimeout(() => inputRef.current?.focus(), 240);

    return () => {
      clearTimeout(entranceTimer);
      clearTimeout(focusTimer);
      entrance.stopAnimation();
    };
  }, [entrance, reduceMotion, rendered, visible]);

  useEffect(() => {
    if (!visible) return;

    const backSubscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (locationMenuOpen) {
          setLocationMenuOpen(false);
          return true;
        }
        handleClose();
        return true;
      },
    );

    return () => {
      backSubscription.remove();
    };
  }, [handleClose, locationMenuOpen, visible]);

  if (!rendered) return null;

  const translateY = entrance.interpolate({
    inputRange: [0, 1],
    outputRange: [22, 0],
  });

  return (
    <View style={styles.overlay} accessibilityViewIsModal>
      <BlurView
        intensity={MOOD_BLUR_INTENSITY}
        tint="light"
        blurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        blurReductionFactor={2}
        blurTarget={blurTarget}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.softVeil} />

      <Pressable
        onPress={handleClose}
        disabled={!visible}
        style={StyleSheet.absoluteFill}
        accessibilityRole="button"
        accessibilityLabel="Fermer Mood"
      />

      <KeyboardAvoidingView
        pointerEvents="box-none"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardArea}
      >
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.content,
            {
              paddingTop: insets.top + 10,
              opacity: entrance,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.locationArea}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                hasLocationOptions
                  ? `Changer la position de développement. Position actuelle : ${locationLabel}`
                  : "Actualiser ma position"
              }
              accessibilityState={{ expanded: locationMenuOpen }}
              disabled={locationRefreshing}
              onPress={handleLocationPress}
              style={[styles.locationPill]}
            >
              <MapPin size={15} color="#EB5757" fill="#EB5757" />
              <Text style={styles.locationText} numberOfLines={1}>
                {locationLabel}
              </Text>
              {hasLocationOptions ? (
                <ChevronDown
                  size={19}
                  color="#111111"
                  strokeWidth={2.2}
                  style={{
                    transform: [
                      { rotate: locationMenuOpen ? "180deg" : "0deg" },
                    ],
                  }}
                />
              ) : (
                <RefreshCw
                  size={17}
                  color="#111111"
                  strokeWidth={2}
                  style={{ opacity: locationRefreshing ? 0.45 : 1 }}
                />
              )}
            </Pressable>

            {hasLocationOptions && locationMenuOpen && (
              <View style={styles.locationMenu}>
                {locationOptions.map((option) => {
                  const selected = option.id === selectedLocationId;

                  return (
                    <Pressable
                      key={option.id}
                      accessibilityRole="menuitem"
                      accessibilityState={{ selected }}
                      onPress={() => handleLocationSelect(option.id)}
                      style={[
                        styles.locationOption,
                        selected && styles.locationOptionSelected,
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.locationOptionText,
                          selected && styles.locationOptionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                      {selected && (
                        <Check size={17} color="#FFFFFF" strokeWidth={2.4} />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.intentBar}>
            <Text style={styles.intentMuted}>Quoi</Text>
            <Text style={styles.intentActive}>Peu importe</Text>
          </View>

          <View style={styles.moodCard}>
            <Text style={styles.title}>Mood</Text>

            <View style={styles.searchField}>
              <Search size={22} color="#666B70" strokeWidth={1.9} />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                style={styles.input}
                placeholder="Quelle envie pour explorer, ou #"
                placeholderTextColor="#70757A"
                autoCapitalize="sentences"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleSearchSubmit}
                maxLength={120}
                selectionColor="#111111"
                accessibilityLabel="Décrire votre mood"
              />
            </View>

            <Text style={styles.sectionTitle}>Populaire en ce moment</Text>

            <View style={styles.suggestionsFrame}>
              <ScrollView
                style={styles.suggestions}
                contentContainerStyle={styles.suggestionsContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                overScrollMode="never"
              >
                {MOOD_SUGGESTIONS.map((suggestion) => {
                  const Icon = suggestion.icon;
                  const isSelected = activeMoodId === suggestion.id;
                  return (
                    <Pressable
                      key={suggestion.id}
                      onPress={() => handleSuggestionPress(suggestion)}
                      style={[
                        styles.suggestion,
                        isSelected && {
                          backgroundColor: theme.green50,
                          borderColor: theme.green900,
                          borderWidth: 1.5,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${suggestion.title}. ${suggestion.description}`}
                    >
                      <View style={styles.suggestionRow}>
                        <View
                          style={[
                            styles.iconTile,
                            { backgroundColor: suggestion.backgroundColor },
                          ]}
                        >
                          <Icon
                            size={27}
                            color={suggestion.iconColor}
                            strokeWidth={1.8}
                          />
                        </View>
                        <View style={styles.suggestionCopy}>
                          <Text
                            style={styles.suggestionTitle}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {suggestion.title}
                          </Text>
                          <Text
                            style={styles.suggestionDescription}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {suggestion.description}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <LinearGradient
                pointerEvents="none"
                colors={["rgba(255,255,255,0.55)", "rgba(255,255,255,0.85)"]}
                style={styles.suggestionsFade}
              />
            </View>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    elevation: 100,
  },
  keyboardArea: {
    flex: 1,
  },
  softVeil: {
    ...StyleSheet.absoluteFill,
    backgroundColor: MOOD_SOFT_VEIL_COLOR,
  },
  content: {
    flex: 1,
    paddingHorizontal: 18,
    // paddingBottom: 8,
  },
  locationArea: {
    alignItems: "center",
    alignSelf: "center",
    maxWidth: "72%",
    position: "relative",
    zIndex: 10,
  },
  locationPill: {
    minHeight: 44,
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: "rgba(246,246,248,0.88)",
  },
  locationText: {
    flexShrink: 1,
    color: "#111111",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600",
  },
  locationMenu: {
    backgroundColor: "rgba(255,255,255,0.98)",
    borderColor: "rgba(17,17,17,0.07)",
    borderCurve: "continuous",
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: "0 12px 30px rgba(42, 47, 42, 0.16)",
    gap: 4,
    minWidth: 176,
    padding: 6,
    position: "absolute",
    top: 50,
  },
  locationOption: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 42,
    paddingHorizontal: 13,
  },
  locationOptionSelected: {
    backgroundColor: "#111111",
  },
  locationOptionText: {
    color: "#4F5256",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
  },
  locationOptionTextSelected: {
    color: "#FFFFFF",
  },
  intentBar: {
    minHeight: 68,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderRadius: 22,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.94)",
    boxShadow: "0 8px 28px rgba(74, 84, 72, 0.08)",
  },
  intentMuted: {
    color: "#73777B",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
  },
  intentActive: {
    color: "#111111",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  moodCard: {
    flex: 1,
    minHeight: 292,
    maxHeight: 410,
    marginTop: 14,
    overflow: "hidden",
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 4,
    borderRadius: 24,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.95)",
    boxShadow: "0 14px 36px rgba(68, 79, 69, 0.12)",
  },
  title: {
    color: "#0B0B0C",
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "700",
  },
  searchField: {
    height: 52,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 17,
    borderWidth: 1,
    borderColor: "#D4D6D7",
    borderRadius: 20,
    borderCurve: "continuous",
    backgroundColor: "rgba(255,255,255,0.44)",
  },
  input: {
    minWidth: 0,
    height: "100%",
    flex: 1,
    paddingVertical: 0,
    color: "#111111",
    fontSize: 15.5,
    fontWeight: "400",
  },
  sectionTitle: {
    marginTop: 16,
    color: "#111111",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  suggestionsFrame: {
    flex: 1,
    marginTop: 8,
    marginHorizontal: -5,
    overflow: "hidden",
  },
  suggestions: {
    flex: 1,
  },
  suggestionsContent: {
    width: "100%",
    alignItems: "stretch",
    paddingHorizontal: 5,
    paddingBottom: 44,
  },
  suggestionsFade: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 50,
    borderRadius: 18,
  },
  suggestion: {
    width: "100%",
    height: 68,
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: 18,
  },
  suggestionRow: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
  },
  iconTile: {
    width: 46,
    height: 46,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderRadius: 15,
    borderCurve: "continuous",
  },
  suggestionCopy: {
    minWidth: 0,
    flex: 1,
    flexShrink: 1,
    justifyContent: "center",
  },
  suggestionTitle: {
    color: "#151515",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600",
  },
  suggestionDescription: {
    marginTop: 2,
    color: "#70757A",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "400",
  },
});
