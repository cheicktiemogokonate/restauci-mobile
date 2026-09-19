import { useEnvoyerCommande } from "@/hooks/useEnvoyerCommande";
import { useGeoSearch } from "@/hooks/useGeoSearch";
import {
  aggregateCartItems,
  buildLogicalOrder,
  getSupportedCheckoutModes,
  hasInvalidItemQuantity,
  prepareIdempotentOrder,
  type CheckoutMode,
  type PendingOrder,
} from "@/domain/checkout";
import { formaterAdresse } from "@/lib/adresses";
import { formatPrix } from "@/lib/format";
import { useStore } from "@/store";
import type { ModeCommande, Suggestion } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import * as ExpoLocation from "expo-location";
import { useRouter } from "expo-router";
import {
  Banknote,
  Check,
  ChevronDown,
  ChevronUp,
  LocateFixed,
  MapPin,
  MessageSquareText,
  ShoppingBag,
  Truck,
} from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";

// Le détail restaurant ne publie pas encore ses moyens de paiement activés.
// Ne proposer que l'espèce évite d'afficher une option que l'API peut refuser.
const supportedPaymentMethodSchema = z.literal("cash");

const livraisonSchema = z.object({
  mode: z.literal("livraison"),
  adresse: z.string().trim().min(5, "Adresse trop courte"),
  notes: z
    .string()
    .max(500, "La note ne peut pas dépasser 500 caractères")
    .optional(),
  paymentMethod: supportedPaymentMethodSchema,
});

const emporterSchema = z.object({
  mode: z.literal("emporter"),
  adresse: z.string().optional(),
  notes: z
    .string()
    .max(500, "La note ne peut pas dépasser 500 caractères")
    .optional(),
  paymentMethod: supportedPaymentMethodSchema,
});

const commandeSchema = z.discriminatedUnion("mode", [
  livraisonSchema,
  emporterSchema,
]);
export type CommandeFormData = z.infer<typeof commandeSchema>;

interface CheckoutFormProps {
  restaurantSlug: string;
  modesCommande: ModeCommande[];
  restaurantDisponible: boolean;
  commandeMinimum: number;
  sousTotal: number;
  total: number;
  onModeChange: (mode: CheckoutMode) => void;
  onSuccess: (commandeId: string, paymentUrl: string | null) => void;
}

export function CheckoutForm({
  restaurantSlug,
  modesCommande,
  restaurantDisponible,
  commandeMinimum,
  sousTotal,
  total,
  onModeChange,
  onSuccess,
}: CheckoutFormProps) {
  const insets = useSafeAreaInsets();
  const [isLocating, setIsLocating] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const pendingOrderRef = useRef<PendingOrder | null>(null);
  const submissionInFlightRef = useRef(false);
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const router = useRouter();

  const client = useStore((s) => s.client);
  const items = useStore((s) => s.items);
  const adresses = useStore((s) => s.adresses);
  const { mutate: envoyerCommande, isPending } = useEnvoyerCommande();
  const availableModes = useMemo(
    () => getSupportedCheckoutModes(modesCommande),
    [modesCommande],
  );

  const adresseParDefaut = useMemo(
    () =>
      adresses.find((adresse) => adresse.estParDefaut) ??
      adresses[0] ??
      null,
    [adresses],
  );
  const adresseParDefautFormatee = adresseParDefaut
    ? formaterAdresse(adresseParDefaut)
    : "";

  const defaultValues = useMemo<CommandeFormData>(() => {
    if (client) {
      return {
        mode: availableModes[0] ?? "livraison",
        adresse: adresseParDefautFormatee,
        notes: "",
        paymentMethod: "cash",
      };
    }
    return {
      mode: availableModes[0] ?? "livraison",
      adresse: "",
      notes: "",
      paymentMethod: "cash",
    };
  }, [adresseParDefautFormatee, availableModes, client]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
  } = useForm<CommandeFormData>({
    resolver: zodResolver(commandeSchema),
    defaultValues,
  });

  const watchMode = useWatch({ control, name: "mode" });
  const watchAdresse = useWatch({ control, name: "adresse" });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: geoSuggestions, isLoading: geoLoading } = useGeoSearch(
    showSuggestions ? watchAdresse || "" : "",
  );

  useEffect(
    () => () => {
      Keyboard.dismiss();
      submissionInFlightRef.current = false;
      pendingOrderRef.current = null;
    },
    [],
  );

  useEffect(() => {
    const fallbackMode = availableModes[0];
    if (fallbackMode && !availableModes.includes(watchMode)) {
      setValue("mode", fallbackMode, { shouldValidate: true });
      return;
    }
    if (availableModes.includes(watchMode)) {
      onModeChange(watchMode);
    }
  }, [availableModes, onModeChange, setValue, watchMode]);

  useEffect(() => {
    if (!adresseParDefautFormatee || getValues("adresse")?.trim()) {
      return;
    }
    setValue("adresse", adresseParDefautFormatee);
  }, [adresseParDefautFormatee, getValues, setValue]);

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    setValue("adresse", suggestion.label);
    setDeliveryCoordinates({
      latitude: suggestion.lat,
      longitude: suggestion.lon,
    });
    setShowSuggestions(false);
  };

  const handleLocate = async () => {
    setIsLocating(true);
    try {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const result = await ExpoLocation.requestForegroundPermissionsAsync();
        if (result.status !== "granted") {
          Alert.alert(
            "Localisation refusée",
            "Autorisez ToutCi à utiliser votre position pour renseigner cette adresse.",
          );
          return;
        }
      }
      const loc = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      const [address] = await ExpoLocation.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (address) {
        const parts = [
          address.streetNumber,
          address.street,
          address.district,
          address.city,
          address.country,
        ].filter(Boolean);
        setValue("adresse", parts.join(", "));
        setDeliveryCoordinates({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch {
      Alert.alert(
        "Position indisponible",
        "Impossible de récupérer votre position. Vous pouvez saisir l’adresse manuellement.",
      );
    } finally {
      setIsLocating(false);
    }
  };

  const onSubmit = (data: CommandeFormData) => {
    if (submissionInFlightRef.current) return;

    if (!client) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      router.push("/auth/login");
      return;
    }

    if (!items.length) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Panier vide", "Votre panier ne contient aucun plat.");
      return;
    }

    if (!restaurantDisponible) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Commande indisponible",
        "Cet établissement n’accepte pas de commande pour le moment.",
      );
      return;
    }

    if (sousTotal < commandeMinimum) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Minimum de commande non atteint",
        `Cet établissement demande un minimum de ${commandeMinimum.toLocaleString("fr-FR")} FCFA.`,
      );
      return;
    }

    if (!modesCommande.includes(data.mode)) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert(
        "Mode indisponible",
        "Le mode de commande sélectionné n’est pas accepté par cet établissement.",
      );
      return;
    }

    if (data.mode === "livraison" && !data.adresse?.trim()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Adresse requise", "Veuillez renseigner une adresse de livraison.");
      return;
    }

    const aggregatedItems = aggregateCartItems(items);

    if (hasInvalidItemQuantity(aggregatedItems)) {
      Alert.alert(
        "Quantité invalide",
        "Chaque plat doit avoir une quantité comprise entre 1 et 20.",
      );
      return;
    }

    const fallbackCoordinates =
      data.mode === "livraison" &&
      data.adresse.trim() === adresseParDefautFormatee.trim() &&
      typeof adresseParDefaut?.latitude === "number" &&
      typeof adresseParDefaut.longitude === "number"
        ? {
            latitude: adresseParDefaut.latitude,
            longitude: adresseParDefaut.longitude,
          }
        : null;
    const coordinates = deliveryCoordinates ?? fallbackCoordinates;
    const logicalOrder = buildLogicalOrder({
      restaurantSlug,
      mode: data.mode,
      items: aggregatedItems,
      adresse: data.adresse,
      coordinates,
      notes: data.notes,
      paymentMethod: data.paymentMethod,
    });
    const preparedOrder = prepareIdempotentOrder(
      logicalOrder,
      pendingOrderRef.current,
      Crypto.randomUUID,
    );
    pendingOrderRef.current = preparedOrder.pendingOrder;
    submissionInFlightRef.current = true;
    Keyboard.dismiss();

    envoyerCommande(preparedOrder.payload, {
      onSuccess: async (result) => {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}

        const id = result?.id ?? "";
        if (!id && __DEV__) {
          console.warn("[CheckoutForm] commande sans id, redirection liste");
        }
        pendingOrderRef.current = null;
        submissionInFlightRef.current = false;
        onSuccess(id, result.payment.authorizationUrl);
      },

      onError: async (error) => {
        submissionInFlightRef.current = false;
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch {}

        Alert.alert(
          "Commande impossible",
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de la création de votre commande.",
        );
      },
    });
  };

  return (
    <View style={styles.sheet}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {availableModes.length > 1 && (
            <View style={styles.modeSelector}>
              {availableModes.map((mode) => {
                const selected = watchMode === mode;
                const Icon = mode === "livraison" ? Truck : ShoppingBag;
                return (
                  <Pressable
                    key={mode}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    onPress={() => setValue("mode", mode)}
                    style={[
                      styles.modeButton,
                      selected && styles.modeButtonSelected,
                    ]}
                  >
                    <Icon
                      color={selected ? "#14532D" : "#6B6B66"}
                      size={17}
                      strokeWidth={2}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.modeLabel,
                        selected && styles.modeLabelSelected,
                      ]}
                    >
                      {mode === "livraison" ? "Livraison" : "À emporter"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {watchMode === "livraison" && (
            <View style={styles.section}>
              <View style={styles.sectionHeading}>
                <MapPin color="#111111" size={18} strokeWidth={2} />
                <Text style={styles.sectionTitle}>Adresse de livraison</Text>
              </View>

              {adresses.length > 0 && (
                <ScrollView
                  horizontal
                  keyboardShouldPersistTaps="handled"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.addressChips}
                >
                  {adresses.map((adresse) => {
                    const adresseFormatee = formaterAdresse(adresse);
                    const selected = watchAdresse?.trim() === adresseFormatee;
                    return (
                      <Pressable
                        key={adresse.id}
                        accessibilityLabel={`Utiliser l’adresse ${adresse.libelle}`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => {
                          setValue("adresse", adresseFormatee, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                          setShowSuggestions(false);
                          setDeliveryCoordinates(
                            typeof adresse.latitude === "number" &&
                              typeof adresse.longitude === "number"
                              ? {
                                  latitude: adresse.latitude,
                                  longitude: adresse.longitude,
                                }
                              : null,
                          );
                        }}
                        style={[styles.addressChip, selected && styles.addressChipSelected]}
                      >
                        {selected && (
                          <Check color="#14532D" size={14} strokeWidth={2.4} />
                        )}
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.addressChipLabel,
                            selected && styles.addressChipLabelSelected,
                          ]}
                        >
                          {adresse.libelle}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              <View style={styles.addressInputRow}>
                <Controller
                  control={control}
                  name="adresse"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      autoCapitalize="sentences"
                      onBlur={() => {
                        onBlur();
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      onChangeText={(text) => {
                        onChange(text);
                        setDeliveryCoordinates(null);
                        setShowSuggestions(text.trim().length > 2);
                      }}
                      onFocus={() => {
                        if (value && value.length > 2) setShowSuggestions(true);
                      }}
                      placeholder="Quartier, rue ou repère"
                      placeholderTextColor="#9A9A95"
                      returnKeyType="done"
                      style={[
                        styles.addressInput,
                        errors.adresse && styles.inputError,
                      ]}
                      value={value}
                    />
                  )}
                />
                <Pressable
                  accessibilityLabel="Utiliser ma position"
                  accessibilityRole="button"
                  disabled={isLocating}
                  onPress={handleLocate}
                  style={[styles.locateButton, isLocating && styles.controlDisabled]}
                >
                  {isLocating ? (
                    <ActivityIndicator color="#14532D" size="small" />
                  ) : (
                    <LocateFixed color="#14532D" size={20} strokeWidth={2} />
                  )}
                </Pressable>
              </View>

              {showSuggestions && geoSuggestions && geoSuggestions.length > 0 && (
                <View style={styles.suggestions}>
                  {geoSuggestions.slice(0, 3).map((item, index) => (
                    <Pressable
                      key={`${item.label}-${index}`}
                      onPress={() => handleSelectSuggestion(item)}
                      style={styles.suggestionRow}
                    >
                      <MapPin color="#777772" size={15} strokeWidth={1.9} />
                      <Text numberOfLines={1} style={styles.suggestionLabel}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {showSuggestions &&
                watchAdresse &&
                watchAdresse.length > 2 &&
                geoSuggestions?.length === 0 &&
                !geoLoading && (
                  <Text style={styles.emptySuggestion}>Aucune adresse trouvée</Text>
                )}

              {errors.adresse && (
                <Text style={styles.errorText}>{errors.adresse.message}</Text>
              )}
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.paymentSectionTitle}>Moyen de paiement</Text>
            <View style={styles.paymentRow}>
              <View style={styles.paymentIcon}>
                <Banknote color="#14532D" size={20} strokeWidth={2} />
              </View>
              <View style={styles.paymentCopy}>
                <Text style={styles.paymentTitle}>Paiement à la réception</Text>
                <Text numberOfLines={1} style={styles.paymentDescription}>
                  En espèces auprès du restaurant ou du livreur
                </Text>
              </View>
              <View style={styles.selectedIndicator}>
                <Check color="#FFFFFF" size={14} strokeWidth={2.7} />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.paymentSectionTitle}>Récapitulatif</Text>
            <View style={styles.summaryLines}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Sous-total</Text>
                <Text style={styles.summaryValue}>{formatPrix(sousTotal)}</Text>
              </View>
              {watchMode === "livraison" && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Livraison</Text>
                  <Text style={styles.summaryValue}>
                    {total - sousTotal === 0
                      ? "Gratuite"
                      : formatPrix(Math.max(0, total - sousTotal))}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total</Text>
              <Text style={styles.summaryTotalValue}>{formatPrix(total)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: notesExpanded }}
              onPress={() => setNotesExpanded((current) => !current)}
              style={styles.noteToggle}
            >
              <MessageSquareText color="#111111" size={18} strokeWidth={2} />
              <View style={styles.noteToggleCopy}>
                <Text style={styles.sectionTitle}>Ajouter une note</Text>
                <Text numberOfLines={1} style={styles.noteHint}>
                  Allergie, cuisson ou instruction particulière
                </Text>
              </View>
              {notesExpanded ? (
                <ChevronUp color="#777772" size={18} />
              ) : (
                <ChevronDown color="#777772" size={18} />
              )}
            </Pressable>

            {notesExpanded && (
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    maxLength={500}
                    multiline
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Ex. : sans oignon"
                    placeholderTextColor="#9A9A95"
                    style={styles.notesInput}
                    textAlignVertical="top"
                    value={value}
                  />
                )}
              />
            )}
            {errors.notes && (
              <Text style={styles.errorText}>{errors.notes.message}</Text>
            )}
          </View>

          {client?.telephone && (
            <Text style={styles.contactHint}>
              Le restaurant pourra vous joindre au {client.telephone}.
            </Text>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: isPending }}
            disabled={isPending}
            onPress={() => void handleSubmit(onSubmit)()}
            style={[styles.submitButton, isPending && styles.controlDisabled]}
          >
            {isPending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitButtonLabel}>Confirmer la commande</Text>
            )}
          </Pressable>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addressChip: {
    alignItems: "center",
    backgroundColor: "#F7F7F3",
    borderColor: "#E7E7E2",
    borderCurve: "continuous",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addressChipLabel: {
    color: "#5F5F5A",
    fontSize: 13,
    fontWeight: "600",
  },
  addressChipLabelSelected: {
    color: "#14532D",
  },
  addressChipSelected: {
    backgroundColor: "#EEF6F0",
    borderColor: "#B9D5C1",
  },
  addressChips: {
    gap: 8,
    paddingBottom: 11,
  },
  addressInput: {
    backgroundColor: "#FAFAF7",
    borderColor: "#E4E4DF",
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    color: "#111111",
    flex: 1,
    fontSize: 15,
    minHeight: 50,
    paddingHorizontal: 15,
  },
  addressInputRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
  },
  contactHint: {
    color: "#777772",
    fontSize: 12,
    lineHeight: 17,
    paddingHorizontal: 4,
    textAlign: "center",
  },
  controlDisabled: {
    opacity: 0.55,
  },
  emptySuggestion: {
    color: "#777772",
    fontSize: 13,
    paddingTop: 10,
    textAlign: "center",
  },
  errorText: {
    color: "#B42318",
    fontSize: 12,
    marginTop: 7,
  },
  footer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderColor: "#E7E7E2",
    borderTopWidth: 1,
    boxShadow: "0 -8px 24px rgba(17, 17, 17, 0.07)",
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  inputError: {
    borderColor: "#D92D20",
  },
  locateButton: {
    alignItems: "center",
    backgroundColor: "#EEF6F0",
    borderColor: "#D8E8DC",
    borderCurve: "continuous",
    borderRadius: 16,
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  modeButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 14,
    flex: 1,
    flexDirection: "row",
    gap: 7,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: 10,
  },
  modeButtonSelected: {
    backgroundColor: "#FFFFFF",
    boxShadow: "0 2px 8px rgba(17, 17, 17, 0.08)",
  },
  modeLabel: {
    color: "#6B6B66",
    fontSize: 14,
    fontWeight: "600",
  },
  modeLabelSelected: {
    color: "#14532D",
  },
  modeSelector: {
    backgroundColor: "#EDEDE9",
    borderCurve: "continuous",
    borderRadius: 17,
    flexDirection: "row",
    gap: 4,
    marginBottom: 12,
    padding: 4,
  },
  noteHint: {
    color: "#777772",
    fontSize: 12,
    marginTop: 2,
  },
  notesInput: {
    backgroundColor: "#FAFAF7",
    borderColor: "#E4E4DF",
    borderCurve: "continuous",
    borderRadius: 14,
    borderWidth: 1,
    color: "#111111",
    fontSize: 14,
    marginTop: 12,
    minHeight: 72,
    padding: 12,
  },
  noteToggle: {
    alignItems: "center",
    flexDirection: "row",
  },
  noteToggleCopy: {
    flex: 1,
    marginHorizontal: 10,
    minWidth: 0,
  },
  paymentCopy: {
    flex: 1,
    minWidth: 0,
  },
  paymentDescription: {
    color: "#777772",
    fontSize: 12,
    marginTop: 2,
  },
  paymentIcon: {
    alignItems: "center",
    backgroundColor: "#EEF6F0",
    borderCurve: "continuous",
    borderRadius: 13,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  paymentRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 11,
  },
  paymentSectionTitle: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 12,
  },
  paymentTitle: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAEAE5",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: "0 6px 18px rgba(17, 17, 17, 0.04)",
    marginBottom: 10,
    padding: 14,
  },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#111111",
    fontSize: 14,
    fontWeight: "700",
  },
  selectedIndicator: {
    alignItems: "center",
    backgroundColor: "#14532D",
    borderRadius: 999,
    height: 23,
    justifyContent: "center",
    width: 23,
  },
  sheet: {
    flex: 1,
  },
  submitButton: {
    alignItems: "center",
    backgroundColor: "#14532D",
    borderCurve: "continuous",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 50,
    flex: 1,
    paddingHorizontal: 22,
  },
  submitButtonLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  suggestionLabel: {
    color: "#3F3F3B",
    flex: 1,
    fontSize: 13,
  },
  suggestionRow: {
    alignItems: "center",
    borderBottomColor: "#EFEFEB",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 8,
    minHeight: 40,
    paddingHorizontal: 4,
  },
  suggestions: {
    marginTop: 8,
  },
  summaryDivider: {
    backgroundColor: "rgba(17,17,17,0.08)",
    height: 1,
    marginVertical: 12,
  },
  summaryLabel: {
    color: "#777772",
    fontSize: 13,
  },
  summaryLines: {
    gap: 10,
  },
  summaryRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryTotalLabel: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "800",
  },
  summaryTotalValue: {
    color: "#14532D",
    fontSize: 17,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  summaryValue: {
    color: "#111111",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
});

export default CheckoutForm;
