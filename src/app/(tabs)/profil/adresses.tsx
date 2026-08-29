import { AdresseFormModal } from "@/components/profil/AdresseFormModal";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  formaterAdresse,
  MAX_ADRESSES_LOCALES,
} from "@/lib/adresses";
import { useStore } from "@/store";
import type { AdresseLocale } from "@/types";
import {
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

interface AdresseCardProps {
  adresse: AdresseLocale;
  onEdit: (adresse: AdresseLocale) => void;
  onDelete: (adresse: AdresseLocale) => void;
  onSetDefault: (adresse: AdresseLocale) => void;
}

function AdresseCard({
  adresse,
  onEdit,
  onDelete,
  onSetDefault,
}: AdresseCardProps) {
  return (
    <View
      className={`mb-3 rounded-3xl border bg-white p-4 ${
        adresse.estParDefaut
          ? "border-brand-700"
          : "border-ink-200"
      }`}
    >
      <View className="flex-row items-start">
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
          <MapPin size={22} color="#166534" />
        </View>

        <View className="ml-3 flex-1">
          <View className="flex-row items-center">
            <Text
              className="flex-1 text-base font-bold text-ink-900"
              numberOfLines={1}
            >
              {adresse.libelle}
            </Text>
            {adresse.estParDefaut && (
              <View className="ml-2 rounded-full bg-brand-50 px-3 py-1">
                <Text className="text-xs font-semibold text-brand-800">
                  Par défaut
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-1 text-sm leading-5 text-ink-500">
            {formaterAdresse(adresse)}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-center border-t border-ink-100 pt-3">
        {!adresse.estParDefaut && (
          <Pressable
            onPress={() => onSetDefault(adresse)}
            className="mr-auto flex-row items-center rounded-full bg-ink-50 px-3 py-2"
            accessibilityRole="button"
            accessibilityLabel={`Définir ${adresse.libelle} par défaut`}
          >
            <Star size={15} color="#166534" />
            <Text className="ml-2 text-xs font-semibold text-brand-800">
              Définir par défaut
            </Text>
          </Pressable>
        )}

        <View className={adresse.estParDefaut ? "ml-auto flex-row" : "flex-row"}>
          <Pressable
            onPress={() => onEdit(adresse)}
            className="h-10 w-10 items-center justify-center rounded-full bg-ink-50"
            accessibilityRole="button"
            accessibilityLabel={`Modifier ${adresse.libelle}`}
          >
            <Pencil size={17} color="#374151" />
          </Pressable>
          <Pressable
            onPress={() => onDelete(adresse)}
            className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-danger-50"
            accessibilityRole="button"
            accessibilityLabel={`Supprimer ${adresse.libelle}`}
          >
            <Trash2 size={17} color="#DC2626" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function AdressesScreen() {
  const adresses = useStore((state) => state.adresses);
  const isLoading = useStore((state) => state.isLoadingAdresses);
  const supprimerAdresse = useStore(
    (state) => state.supprimerAdresse,
  );
  const mettreAJourAdresse = useStore(
    (state) => state.mettreAJourAdresse,
  );

  const [isFormVisible, setIsFormVisible] = useState(false);
  const [adresseEnEdition, setAdresseEnEdition] =
    useState<AdresseLocale | null>(null);

  const closeForm = useCallback(() => {
    setIsFormVisible(false);
    setAdresseEnEdition(null);
  }, []);

  const openNewAddress = useCallback(() => {
    if (adresses.length >= MAX_ADRESSES_LOCALES) {
      Alert.alert(
        "Limite atteinte",
        `Vous pouvez enregistrer jusqu’à ${MAX_ADRESSES_LOCALES} adresses.`,
      );
      return;
    }
    setAdresseEnEdition(null);
    setIsFormVisible(true);
  }, [adresses.length]);

  const openEditAddress = useCallback((adresse: AdresseLocale) => {
    setAdresseEnEdition(adresse);
    setIsFormVisible(true);
  }, []);

  const setDefaultAddress = useCallback(
    async (adresse: AdresseLocale) => {
      try {
        await mettreAJourAdresse(adresse.id, {
          estParDefaut: true,
        });
      } catch {
        Alert.alert(
          "Modification impossible",
          "L’adresse par défaut n’a pas pu être modifiée.",
        );
      }
    },
    [mettreAJourAdresse],
  );

  const deleteAddress = useCallback(
    (adresse: AdresseLocale) => {
      Alert.alert(
        "Supprimer cette adresse ?",
        `${adresse.libelle} ne sera plus proposée lors de vos commandes.`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: () => {
              void supprimerAdresse(adresse.id).catch(() => {
                Alert.alert(
                  "Suppression impossible",
                  "L’adresse n’a pas pu être supprimée.",
                );
              });
            },
          },
        ],
      );
    },
    [supprimerAdresse],
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-ink-50">
        <ActivityIndicator size="large" color="#166534" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink-50">
      <FlatList
        data={adresses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AdresseCard
            adresse={item}
            onEdit={openEditAddress}
            onDelete={deleteAddress}
            onSetDefault={setDefaultAddress}
          />
        )}
        ListHeaderComponent={
          <View className="mb-5">
            <View className="rounded-3xl bg-green-900 p-5">
              <Text className="text-lg font-bold text-white">
                Vos lieux de livraison
              </Text>
              <Text className="mt-1 text-sm leading-5 text-white/80">
                Enregistrez vos adresses pour finaliser vos commandes plus
                rapidement.
              </Text>
            </View>

            <Pressable
              onPress={openNewAddress}
              className="mt-4 flex-row items-center justify-center rounded-full bg-brand-700 px-5 py-4"
              accessibilityRole="button"
              accessibilityLabel="Ajouter une adresse"
            >
              <Plus size={20} color="#ffffff" />
              <Text className="ml-2 font-bold text-white">
                Ajouter une adresse
              </Text>
            </Pressable>

            <Text className="mt-4 text-xs text-ink-400">
              {adresses.length}/{MAX_ADRESSES_LOCALES} adresses enregistrées
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            emoji="📍"
            title="Aucune adresse enregistrée"
            message="Ajoutez votre première adresse pour la retrouver automatiquement au moment de commander."
            actionLabel="Ajouter une adresse"
            onAction={openNewAddress}
          />
        }
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 90,
        }}
        showsVerticalScrollIndicator={false}
      />

      <AdresseFormModal
        visible={isFormVisible}
        adresse={adresseEnEdition}
        onClose={closeForm}
      />
    </View>
  );
}
