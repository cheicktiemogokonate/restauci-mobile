import { Button } from "@/components/ui/button";
import { Text as ButtonText } from "@/components/ui/text";
import { useEnvoyerCommande } from "@/hooks/useEnvoyerCommande";
import { useGeoSearch } from "@/hooks/useGeoSearch";
import { useStore } from "@/store";
import type { CommandePayload } from "@/types";
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import * as ExpoLocation from "expo-location";
import { useRouter } from "expo-router";
import { ChevronDown, CircleCheckBig, MapPin } from "lucide-react-native";
import { forwardRef, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

const livraisonSchema = z.object({
  mode: z.literal("livraison"),
  adresse: z.string().min(5, "Adresse trop courte"),
  telephone: z.string().regex(/^\+?[0-9\s]{8,20}$/, "Numéro invalide"),
  notes: z.string().optional(),
});

const emporterSchema = z.object({
  mode: z.literal("emporter"),
  adresse: z.string().optional(),
  telephone: z.string().regex(/^\+?[0-9\s]{8,20}$/, "Numéro invalide"),
  notes: z.string().optional(),
});

const commandeSchema = z.discriminatedUnion("mode", [
  livraisonSchema,
  emporterSchema,
]);
export type CommandeFormData = z.infer<typeof commandeSchema>;

export interface FormulaireCommandeRef {
  open: () => void;
  close: () => void;
}

interface FormulaireCommandeProps {
  restaurantSlug: string; // identifiant attendu par le backend
  fraisLivraison: number;
  onSuccess: (commandeId: string) => void;
  onClose: () => void;
}

const MODE_COLORS: Record<string, string> = {
  livraison: "info",
  emporter: "warning",
};

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
>(({ restaurantSlug, onSuccess, onClose }, ref) => {
  const [isLocating, setIsLocating] = useState(false);
  const router = useRouter();

  const client = useStore((s) => s.client);
  const items = useStore((s) => s.items);
  const { mutate: envoyerCommande, isPending } = useEnvoyerCommande();

  // fraisLivraison retiré : absent du schema zod / de CommandeFormData,
  // il ne doit pas être injecté dans les valeurs du formulaire.
  const defaultValues = useMemo<CommandeFormData>(() => {
    if (client) {
      const formatedTel = client.telephone?.replace("+225", "").trim();
      return {
        mode: "livraison",
        adresse: "",
        telephone: formatedTel ?? "",
        notes: "",
      };
    }
    return {
      mode: "livraison",
      adresse: "",
      telephone: "",
      notes: "",
    };
  }, [client]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CommandeFormData>({
    resolver: zodResolver(commandeSchema),
    defaultValues,
  });

  const watchMode = useWatch({ control, name: "mode" });
  const watchAdresse = useWatch({ control, name: "adresse" });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const { data: geoSuggestions, isLoading: geoLoading } = useGeoSearch(
    watchAdresse || "",
  );

  const handleSelectSuggestion = (label: string) => {
    setValue("adresse", label);
    setShowSuggestions(false);
  };

  const handleLocate = async () => {
    setIsLocating(true);
    try {
      const { status } = await ExpoLocation.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const result = await ExpoLocation.requestForegroundPermissionsAsync();
        if (result.status !== "granted") return;
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
      }
    } catch {
    } finally {
      setIsLocating(false);
    }
  };

  // Bloc onSubmit dupliqué/commenté supprimé (ancienne version morte, non exécutée)

  const onSubmit = (data: CommandeFormData) => {
    // Vérification authentification
    if (!client) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      router.push("/auth/login");
      return;
    }

    // Vérification panier
    if (!items.length) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      Alert.alert("Panier vide", "Votre panier ne contient aucun plat.");

      return;
    }

    // Validation téléphone
    if (!data.telephone?.trim()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      Alert.alert(
        "Téléphone requis",
        "Veuillez renseigner un numéro de téléphone.",
      );

      return;
    }

    // Validation livraison
    if (data.mode === "livraison" && !data.adresse?.trim()) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

      Alert.alert(
        "Adresse requise",
        "Veuillez renseigner une adresse de livraison.",
      );

      return;
    }

    const payload: CommandePayload = {
      restaurantSlug,

      modeCommande: data.mode,

      items: items.map((item) => ({
        platId: item.platId,
        quantite: item.quantite,
      })),

      adresseLivraison:
        data.mode === "livraison" ? data.adresse.trim() : undefined,

      telephone: data.telephone.trim(),

      notes: data.notes?.trim() || undefined,
    };

    console.log(
      "[FormulaireCommande] Payload envoyé:",
      JSON.stringify(payload, null, 2),
    );

    envoyerCommande(payload, {
      onSuccess: async (result) => {
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success,
          );
        } catch {}

        console.log("[FormulaireCommande] Commande créée:", result);

        // Garde-fou : évite un crash si le backend renvoie une réponse sans id
        onSuccess(result?.id ?? "");
      },

      onError: async (error) => {
        try {
          await Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          );
        } catch {}

        console.error("[FormulaireCommande] Erreur:", error);

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
      onDismiss={onClose}
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
          {(["livraison", "emporter"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              className={`flex-1 border-2 rounded-2xl py-3 items-center ${
                watchMode === mode
                  ? `border-[${MODE_COLORS[mode]}] bg-[${MODE_COLORS[mode]}10]`
                  : "border-ink-200"
              }`}
              onPress={() => setValue("mode", mode)}
            >
              <Text
                className={`text-sm font-semibold ${
                  watchMode === mode
                    ? `text-[${MODE_COLORS[mode]}]`
                    : "text-ink-500"
                }`}
              >
                {mode === "livraison" ? "🚚 Livraison" : "📦 À emporter"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {watchMode === "livraison" && (
          <View className="mb-4 relative">
            <Text className="text-sm font-semibold text-ink-700 mb-2">
              Adresse de livraison
            </Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="adresse"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={`border rounded-2xl p-4 text-base bg-gray-50 ${!!errors.adresse ? "border-red-500" : "border-gray-200"}`}
                      placeholder="Ex: Rue de la Paix, Abidjan"
                      onBlur={() => {
                        onBlur();
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      onFocus={() => {
                        if (value && value.length > 2) setShowSuggestions(true);
                      }}
                      onChangeText={(text) => {
                        onChange(text);
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
                    onPress={() => handleSelectSuggestion(item.label)}
                    activeOpacity={0.6}
                  >
                    <MapPin size={16} color="#9ca3af" className="mr-2" />
                    <Text
                      className="flex-1 text-sm text-ink-700 ml-2"
                      numberOfLines={1}
                    >
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
          <Text className="text-black font-semibold mb-2">Téléphone</Text>
          <Controller
            control={control}
            name="telephone"
            render={({ field: { onChange, onBlur, value } }) => (
              <View
                className={`flex-row items-center border rounded-2xl h-14 px-4 ${
                  errors.telephone ? "border-red-500" : "border-gray-200"
                }`}
              >
                <Text className="text-lg mr-1">🇨🇮</Text>
                <Text className="text-black font-medium ml-1">+225</Text>
                <ChevronDown
                  size={16}
                  color="#9ca3af"
                  style={{ marginLeft: 4 }}
                />
                <View className="w-px h-6 bg-gray-200 mx-3" />
                <TextInput
                  className="flex-1 text-black text-base"
                  placeholder="07 51 23 45 67"
                  placeholderTextColor="#9ca3af"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              </View>
            )}
          />
          {errors.telephone && (
            <Text className="text-red-500 text-sm mt-1">
              {errors.telephone.message}
            </Text>
          )}
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
                textAlignVertical="top"
              />
            )}
          />
        </View>

        <Button
          className="rounded-full py-4 items-center mt-2"
          onPress={handleSubmit(onSubmit)}
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
