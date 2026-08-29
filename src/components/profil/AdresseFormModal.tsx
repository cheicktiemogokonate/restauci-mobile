import { Button } from "@/components/ui/button";
import { Text as ButtonText } from "@/components/ui/text";
import { useStore } from "@/store";
import type { AdresseLocale } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

const adresseSchema = z.object({
  libelle: z
    .string()
    .trim()
    .min(2, "Indiquez un libellé")
    .max(40, "40 caractères maximum"),
  adresse: z
    .string()
    .trim()
    .min(5, "Adresse trop courte")
    .max(255, "Adresse trop longue"),
  ville: z.string().trim().max(100, "Ville trop longue"),
  pays: z.string().trim().max(100, "Pays trop long"),
  estParDefaut: z.boolean(),
});

type AdresseFormData = z.infer<typeof adresseSchema>;

interface AdresseFormModalProps {
  visible: boolean;
  adresse: AdresseLocale | null;
  onClose: () => void;
}

function getDefaultValues(
  adresse: AdresseLocale | null,
  premiereAdresse: boolean,
): AdresseFormData {
  return {
    libelle: adresse?.libelle ?? "",
    adresse: adresse?.adresse ?? "",
    ville: adresse?.ville ?? "",
    pays: adresse?.pays ?? "Côte d’Ivoire",
    estParDefaut: adresse?.estParDefaut ?? premiereAdresse,
  };
}

export function AdresseFormModal({
  visible,
  adresse,
  onClose,
}: AdresseFormModalProps) {
  const adressesCount = useStore((state) => state.adresses.length);
  const ajouterAdresse = useStore((state) => state.ajouterAdresse);
  const mettreAJourAdresse = useStore(
    (state) => state.mettreAJourAdresse,
  );
  const [isSaving, setIsSaving] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AdresseFormData>({
    resolver: zodResolver(adresseSchema),
    defaultValues: getDefaultValues(adresse, adressesCount === 0),
  });

  useEffect(() => {
    if (!visible) return;
    reset(getDefaultValues(adresse, adressesCount === 0));
  }, [adresse, adressesCount, reset, visible]);

  const onSubmit = async (data: AdresseFormData) => {
    setIsSaving(true);
    try {
      const values = {
        libelle: data.libelle.trim(),
        adresse: data.adresse.trim(),
        ville: data.ville.trim() || null,
        pays: data.pays.trim() || null,
        estParDefaut: data.estParDefaut,
      };

      if (adresse) {
        await mettreAJourAdresse(adresse.id, values);
      } else {
        await ajouterAdresse(values);
      }
      onClose();
    } catch (error) {
      Alert.alert(
        "Enregistrement impossible",
        error instanceof Error
          ? error.message
          : "L’adresse n’a pas pu être enregistrée.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View className="flex-row items-center justify-between border-b border-ink-100 px-5 py-4">
            <View>
              <Text className="text-xl font-extrabold text-ink-900">
                {adresse ? "Modifier l’adresse" : "Nouvelle adresse"}
              </Text>
              <Text className="mt-1 text-sm text-ink-500">
                Ces informations restent sur cet appareil
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              disabled={isSaving}
              className="h-11 w-11 items-center justify-center rounded-full bg-ink-100"
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <X size={21} color="#374151" />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 32,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-ink-700">
                Libellé
              </Text>
              <Controller
                control={control}
                name="libelle"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Ex : Maison, Bureau"
                    autoCapitalize="words"
                    maxLength={40}
                    className={`h-14 rounded-2xl border bg-ink-50 px-4 text-base text-ink-900 ${
                      errors.libelle
                        ? "border-danger-600"
                        : "border-ink-200"
                    }`}
                  />
                )}
              />
              {errors.libelle && (
                <Text className="mt-1 text-xs text-danger-600">
                  {errors.libelle.message}
                </Text>
              )}
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-ink-700">
                Adresse complète
              </Text>
              <Controller
                control={control}
                name="adresse"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Ex : Cocody Angré, 8e tranche"
                    autoCapitalize="sentences"
                    multiline
                    maxLength={255}
                    textAlignVertical="top"
                    className={`min-h-24 rounded-2xl border bg-ink-50 px-4 py-4 text-base text-ink-900 ${
                      errors.adresse
                        ? "border-danger-600"
                        : "border-ink-200"
                    }`}
                  />
                )}
              />
              {errors.adresse && (
                <Text className="mt-1 text-xs text-danger-600">
                  {errors.adresse.message}
                </Text>
              )}
            </View>

            <View className="mb-5">
              <Text className="mb-2 text-sm font-semibold text-ink-700">
                Ville
              </Text>
              <Controller
                control={control}
                name="ville"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Ex : Abidjan"
                    autoCapitalize="words"
                    maxLength={100}
                    className="h-14 rounded-2xl border border-ink-200 bg-ink-50 px-4 text-base text-ink-900"
                  />
                )}
              />
              {errors.ville && (
                <Text className="mt-1 text-xs text-danger-600">
                  {errors.ville.message}
                </Text>
              )}
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-sm font-semibold text-ink-700">
                Pays
              </Text>
              <Controller
                control={control}
                name="pays"
                render={({ field: { onBlur, onChange, value } }) => (
                  <TextInput
                    value={value}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="Ex : Côte d’Ivoire"
                    autoCapitalize="words"
                    maxLength={100}
                    className="h-14 rounded-2xl border border-ink-200 bg-ink-50 px-4 text-base text-ink-900"
                  />
                )}
              />
              {errors.pays && (
                <Text className="mt-1 text-xs text-danger-600">
                  {errors.pays.message}
                </Text>
              )}
            </View>

            <Controller
              control={control}
              name="estParDefaut"
              render={({ field: { onChange, value } }) => (
                <Pressable
                  onPress={() => onChange(!value)}
                  className="mb-8 flex-row items-center rounded-2xl border border-ink-200 bg-white p-4"
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: value }}
                  accessibilityLabel="Utiliser comme adresse par défaut"
                >
                  <View
                    className={`h-6 w-6 items-center justify-center rounded-md border ${
                      value
                        ? "border-brand-800 bg-brand-800"
                        : "border-ink-300 bg-white"
                    }`}
                  >
                    {value && <Check size={16} color="#ffffff" />}
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="font-semibold text-ink-900">
                      Adresse par défaut
                    </Text>
                    <Text className="mt-0.5 text-xs text-ink-500">
                      Elle sera présélectionnée pour vos livraisons
                    </Text>
                  </View>
                </Pressable>
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="rounded-full"
              accessibilityLabel={
                adresse ? "Enregistrer les modifications" : "Ajouter l’adresse"
              }
            >
              {isSaving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <ButtonText className="text-base font-bold text-white">
                  {adresse ? "Enregistrer" : "Ajouter l’adresse"}
                </ButtonText>
              )}
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
