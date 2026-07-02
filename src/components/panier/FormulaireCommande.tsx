import { useEnvoyerCommande } from "@/hooks/useEnvoyerCommande";
import { useStore } from "@/store";
import type { CommandePayload } from "@/types";
import BottomSheet, {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Haptics from "expo-haptics";
import * as ExpoLocation from "expo-location";
import React, { useCallback, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { z } from "zod";

const livraisonSchema = z.object({
  mode: z.literal("livraison"),
  adresse: z.string().min(5, "Adresse trop courte"),
  telephone: z
    .string()
    .regex(/^\+?[0-9\s]{8,20}$/, "Numéro invalide"),
  notes: z.string().optional(),
});

const emporterSchema = z.object({
  mode: z.literal("emporter"),
  adresse: z.string().optional(),
  telephone: z
    .string()
    .regex(/^\+?[0-9\s]{8,20}$/, "Numéro invalide"),
  notes: z.string().optional(),
});

const commandeSchema = z.discriminatedUnion("mode", [livraisonSchema, emporterSchema]);
export type CommandeFormData = z.infer<typeof commandeSchema>;

export interface FormulaireCommandeRef {
  open: () => void;
  close: () => void;
}

interface FormulaireCommandeProps {
  restaurantId: string;
  fraisLivraison: number;
  onSuccess: (commandeId: string) => void;
}

const MODE_COLORS: Record<string, string> = {
  livraison: "#3b82f6",
  emporter: "#f59e0b",
};

export const FormulaireCommande = React.forwardRef<
  FormulaireCommandeRef,
  FormulaireCommandeProps
>(({ restaurantId, fraisLivraison, onSuccess }, ref) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["85%"], []);
  const [isLocating, setIsLocating] = useState(false);

  const client = useStore((s) => s.client);
  const items = useStore((s) => s.items);
  const { mutate: envoyerCommande, isPending } = useEnvoyerCommande();

  const defaultValues = useMemo<CommandeFormData>(() => {
    if (client) {
      return {
        mode: "livraison",
        adresse: "",
        telephone: client.telephone ?? "",
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
    watch,
    formState: { errors },
    setValue,
  } = useForm<CommandeFormData>({
    resolver: zodResolver(commandeSchema),
    defaultValues,
  });

  const watchMode = watch("mode");

  useImperativeHandle(ref, () => ({
    open: () => bottomSheetRef.current?.snapToIndex(0),
    close: () => bottomSheetRef.current?.close(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    []
  );

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

  const onSubmit = (data: CommandeFormData) => {
    const payload: CommandePayload = {
      restaurantId,
      items,
      adresseLivraison: data.mode === "livraison" ? data.adresse : "",
      telephone: data.telephone,
      notes: data.notes,
    };
    envoyerCommande(payload, {
      onSuccess: async (resultData) => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        bottomSheetRef.current?.close();
        onSuccess((resultData as { id?: string })?.id ?? "commande");
      },
      onError: async () => {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      },
    });
  };

  const inputStyle = (hasError: boolean) =>
    `border rounded-xl p-4 text-base bg-gray-50 ${hasError ? "border-red-500" : "border-gray-200"}`;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleStyle={styles.handleStyle}
      handleIndicatorStyle={styles.handleIndicator}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetScrollView
        className="px-5"
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Finaliser la commande</Text>

        <View style={styles.modeRow}>
          {(["livraison", "emporter"] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                watchMode === mode && {
                  borderColor: MODE_COLORS[mode],
                  backgroundColor: `${MODE_COLORS[mode]}10`,
                },
              ]}
              onPress={() => setValue("mode", mode)}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  watchMode === mode && { color: MODE_COLORS[mode] },
                ]}
              >
                {mode === "livraison" ? "🚚 Livraison" : "📦 Emporter"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {watchMode === "livraison" && (
          <View className="mb-4">
            <Text style={styles.label}>Adresse de livraison</Text>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Controller
                  control={control}
                  name="adresse"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput
                      className={inputStyle(!!errors.adresse)}
                      placeholder="Ex: Rue de la Paix, Abidjan"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      numberOfLines={2}
                    />
                  )}
                />
              </View>
              <TouchableOpacity
                style={styles.locateButton}
                onPress={handleLocate}
                disabled={isLocating}
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Text style={styles.locateButtonText}>📍</Text>
                )}
              </TouchableOpacity>
            </View>
            {errors.adresse && (
              <Text style={styles.error}>{errors.adresse.message}</Text>
            )}
          </View>
        )}

        <View className="mb-4">
          <Text style={styles.label}>Téléphone</Text>
          <Controller
            control={control}
            name="telephone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={inputStyle(!!errors.telephone)}
                placeholder="+225 07 00 00 00"
                keyboardType="phone-pad"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.telephone && (
            <Text style={styles.error}>{errors.telephone.message}</Text>
          )}
        </View>

        <View className="mb-4">
          <Text style={styles.label}>
            Notes <Text style={styles.optional}>(optionnel)</Text>
          </Text>
          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className={`border rounded-xl p-4 text-base bg-gray-50 border-gray-200`}
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

        <TouchableOpacity
          style={[styles.submitButton, isPending && styles.submitButtonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isPending}
        >
          {isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Confirmer la commande</Text>
          )}
        </TouchableOpacity>

        <View className="pb-8" />
      </BottomSheetScrollView>
    </BottomSheet>
  );
});

FormulaireCommande.displayName = "FormulaireCommande";

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleStyle: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleIndicator: {
    backgroundColor: "#d1d5db",
    width: 40,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 20,
    textAlign: "center",
  },
  modeRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  optional: {
    fontWeight: "400",
    color: "#9ca3af",
  },
  error: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 4,
  },
  locateButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    justifyContent: "center",
    alignItems: "center",
  },
  locateButtonText: {
    fontSize: 20,
  },
  submitButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
});

export default FormulaireCommande;