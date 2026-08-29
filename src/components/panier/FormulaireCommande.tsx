import { Button } from "@/components/ui/button";
import { Text as ButtonText } from "@/components/ui/text";
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
import { useStore } from "@/store";
import type { ModeCommande, Suggestion } from "@/types";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import * as ExpoLocation from "expo-location";
import { useRouter } from "expo-router";
import { CircleCheckBig, MapPin } from "lucide-react-native";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

const livraisonSchema = z.object({
  mode: z.literal("livraison"),
  adresse: z.string().trim().min(5, "Adresse trop courte"),
  notes: z.string().max(500, "La note ne peut pas dépasser 500 caractères").optional(),
  paymentMethod: z.enum(["cash", "mobile_money", "card"]),
});

const emporterSchema = z.object({
  mode: z.literal("emporter"),
  adresse: z.string().optional(),
  notes: z.string().max(500, "La note ne peut pas dépasser 500 caractères").optional(),
  paymentMethod: z.enum(["cash", "mobile_money", "card"]),
});

const commandeSchema = z.discriminatedUnion("mode", [
  livraisonSchema,
  emporterSchema,
]);
export type CommandeFormData = z.infer<typeof commandeSchema>;

interface FormulaireCommandeProps {
  restaurantSlug: string;
  modesCommande: ModeCommande[];
  restaurantDisponible: boolean;
  commandeMinimum: number;
  sousTotal: number;
  onModeChange: (mode: CheckoutMode) => void;
  onSuccess: (commandeId: string, paymentUrl: string | null) => void;
  onClose: () => void;
}

const CustomBackdrop = (props: BottomSheetBackdropProps) => {
  return (
    <BottomSheetBackdrop
      {...props}
      appearsOnIndex={0}
      disappearsOnIndex={-1}
      opacity={0.5}
      pressBehavior="close"
    />
  );
};

export const FormulaireCommande = forwardRef<
  BottomSheetModal,
  FormulaireCommandeProps
>(({
  restaurantSlug,
  modesCommande,
  restaurantDisponible,
  commandeMinimum,
  sousTotal,
  onModeChange,
  onSuccess,
  onClose,
}, ref) => {
  const [isLocating, setIsLocating] = useState(false);
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
    reset,
    setValue,
  } = useForm<CommandeFormData>({
    resolver: zodResolver(commandeSchema),
    defaultValues,
  });

  const watchMode = useWatch({ control, name: "mode" });
  const watchAdresse = useWatch({ control, name: "adresse" });
  const watchPaymentMethod = useWatch({ control, name: "paymentMethod" });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: geoSuggestions, isLoading: geoLoading } = useGeoSearch(
    showSuggestions ? watchAdresse || "" : "",
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

    envoyerCommande(preparedOrder.payload, {
      onSuccess: async (result) => {
        try {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {}

        const id = result?.id ?? "";
        if (!id && __DEV__) {
          console.warn("[FormulaireCommande] commande sans id, redirection liste");
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

        if (__DEV__) {
          console.error("[FormulaireCommande] Erreur:", error);
        }

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
    <BottomSheetModal
      ref={ref}
      snapPoints={["70%"]}
      enableDynamicSizing={false}
      enablePanDownToClose
      enableOverDrag={false}
      onChange={(index) => {
        if (index >= 0) {
          reset(defaultValues);
          setDeliveryCoordinates(null);
          setShowSuggestions(false);
        }
      }}
      onDismiss={() => {
        submissionInFlightRef.current = false;
        pendingOrderRef.current = null;
        setDeliveryCoordinates(null);
        onClose();
      }}
      backgroundStyle={{ backgroundColor: "#ffffff" }}
      handleIndicatorStyle={{ backgroundColor: "#d1d5db" }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={(props) => <CustomBackdrop {...props} />}
    >
      <BottomSheetScrollView
        className="px-5"
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xl font-bold text-ink-900 mb-5 text-center">
          Finaliser la commande
        </Text>

        <View className="flex-row gap-3 mb-6">
          {availableModes.map((mode) => {
            const isLivraison = mode === "livraison";
            const isSelected = watchMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                className={`flex-1 border-2 rounded-2xl py-3 items-center ${
                  isSelected
                    ? isLivraison
                      ? "border-brand-700 bg-brand-50"
                      : "border-warning bg-warning/10"
                    : "border-ink-200"
                }`}
                onPress={() => setValue("mode", mode)}
              >
                <Text
                  className={`text-sm font-semibold ${
                    isSelected
                      ? isLivraison
                        ? "text-brand-700"
                        : "text-warning"
                      : "text-ink-500"
                  }`}
                >
                  {mode === "livraison" ? "🚚 Livraison" : "📦 À emporter"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {watchMode === "livraison" && (
          <View className="mb-4 relative">
            <Text className="text-sm font-semibold text-ink-700 mb-2">
              Adresse de livraison
            </Text>

            {adresses.length > 0 && (
              <View className="mb-3">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ gap: 8 }}
                >
                  {adresses.map((adresse) => {
                    const adresseFormatee = formaterAdresse(adresse);
                    const isSelected =
                      watchAdresse?.trim() === adresseFormatee;

                    return (
                      <TouchableOpacity
                        key={adresse.id}
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
                        className={`max-w-64 rounded-2xl border px-4 py-3 ${
                          isSelected
                            ? "border-brand-700 bg-brand-50"
                            : "border-ink-200 bg-white"
                        }`}
                        accessibilityRole="button"
                        accessibilityState={{ selected: isSelected }}
                        accessibilityLabel={`Utiliser l’adresse ${adresse.libelle}`}
                      >
                        <View className="flex-row items-center">
                          <Text
                            className={`font-bold ${
                              isSelected
                                ? "text-brand-800"
                                : "text-ink-900"
                            }`}
                            numberOfLines={1}
                          >
                            {adresse.libelle}
                          </Text>
                          {adresse.estParDefaut && (
                            <Text className="ml-2 text-xs text-brand-700">
                              Par défaut
                            </Text>
                          )}
                        </View>
                        <Text
                          className="mt-1 text-xs text-ink-500"
                          numberOfLines={2}
                        >
                          {adresseFormatee}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View className="flex-row gap-2">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="adresse"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-2xl p-4 text-base bg-gray-50 ${
                        !!errors.adresse ? "border-red-500" : "border-gray-200"
                      }`}
                      placeholder="Ex : Quartier Commerce, Bouaké"
                      onBlur={() => {
                        onBlur();
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      onFocus={() => {
                        if (value && value.length > 2) setShowSuggestions(true);
                      }}
                      onChangeText={(text) => {
                        onChange(text);
                        setDeliveryCoordinates(null);
                        setShowSuggestions(text.trim().length > 2);
                      }}
                      value={value}
                      multiline={false}
                    />
                  )}
                />
              </View>
              <TouchableOpacity
                className="w-16 h-14 rounded-2xl bg-ink-50 border border-ink-200 justify-center items-center"
                onPress={handleLocate}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#14532d" />
                ) : (
                  <MapPin color="#14532d" />
                )}
              </TouchableOpacity>
            </View>

            {showSuggestions && geoSuggestions && geoSuggestions.length > 0 && (
              <View className="bg-white rounded-2xl mt-1 shadow-md overflow-hidden z-10 absolute top-20 left-0 right-0 max-h-48">
                {geoSuggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`${item.label}-${index}`}
                    className="flex-row items-center px-3 py-3 border-b border-gray-100 bg-white"
                    onPress={() => handleSelectSuggestion(item)}
                    activeOpacity={0.6}
                  >
                    <MapPin size={16} color="#9ca3af" className="mr-2" />
                    <Text className="flex-1 text-sm text-ink-700 ml-2" numberOfLines={1}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {showSuggestions &&
              watchAdresse &&
              watchAdresse.length > 2 &&
              geoSuggestions?.length === 0 &&
              !geoLoading && (
                <View className="bg-white rounded-2xl mt-1 shadow-md overflow-hidden z-10 absolute top-20 left-0 right-0">
                  <View className="px-3.5 py-3 bg-white">
                    <Text className="text-sm text-ink-400 text-center">
                      Aucun résultat
                    </Text>
                  </View>
                </View>
              )}

            {errors.adresse && (
              <Text className="text-xs text-danger-600 mt-1">
                {errors.adresse.message}
              </Text>
            )}
          </View>
        )}

        <View className="mb-4">
          <Text className="text-sm font-semibold text-ink-700 mb-2">
            Moyen de paiement
          </Text>
          <View className="gap-2">
            {([
              ["cash", "Espèces", "Paiement à la réception"],
              ["mobile_money", "Mobile money", "Paiement sécurisé Paystack"],
              ["card", "Carte bancaire", "Paiement sécurisé Paystack"],
            ] as const).map(([value, label, description]) => {
              const selected = watchPaymentMethod === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setValue("paymentMethod", value, { shouldValidate: true })}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  className={`rounded-2xl border px-4 py-3 ${
                    selected ? "border-brand-700 bg-brand-50" : "border-ink-200 bg-white"
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View>
                      <Text className={`font-bold ${selected ? "text-brand-800" : "text-ink-900"}`}>
                        {label}
                      </Text>
                      <Text className="mt-1 text-xs text-ink-500">{description}</Text>
                    </View>
                    <View className={`h-5 w-5 rounded-full border-2 items-center justify-center ${
                      selected ? "border-brand-700" : "border-ink-300"
                    }`}>
                      {selected ? <View className="h-2.5 w-2.5 rounded-full bg-brand-700" /> : null}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-black font-semibold mb-2">Téléphone</Text>
          <View className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
            <Text className="text-base font-medium text-ink-900">
              {client?.telephone || "Numéro du compte indisponible"}
            </Text>
            <Text className="mt-1 text-xs text-ink-500">
              Numéro associé à votre compte et transmis au restaurant
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-sm font-semibold text-ink-700 mb-2">
            Notes <Text className="font-normal text-ink-400">(optionnel)</Text>
          </Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="border rounded-2xl p-4 text-base bg-gray-50 border-gray-200"
                placeholder="Ex: Sans oignon, instructions spéciales..."
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                maxLength={500}
                textAlignVertical="top"
              />
            )}
          />
          {errors.notes && (
            <Text className="mt-1 text-xs text-danger-600">
              {errors.notes.message}
            </Text>
          )}
        </View>

        <Button
          className="rounded-full py-4 items-center mt-2"
          onPress={() => void handleSubmit(onSubmit)()}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <View className="flex-row gap-4 items-center">
              <ButtonText className="text-white text-base font-bold">
                Confirmer la commande
              </ButtonText>
              <CircleCheckBig color="#fff" />
            </View>
          )}
        </Button>

        <View className="pb-8" />
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

FormulaireCommande.displayName = "FormulaireCommande";

export default FormulaireCommande;
