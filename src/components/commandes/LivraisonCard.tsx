import { Button } from "@/components/ui/button";
import { Text as ButtonText } from "@/components/ui/text";
import type { ClientDelivery, StatutLivraison } from "@/types";
import {
  Bike,
  CheckCircle2,
  Clock3,
  Phone,
  ShieldCheck,
  Truck,
} from "lucide-react-native";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import { theme } from "@/constants/theme";

const DELIVERY_LABELS: Record<StatutLivraison, string> = {
  en_attente: "Livreur en attente",
  assignee: "Livreur assigné",
  en_route: "Livreur en route",
  livree: "Livraison terminée",
  echouee: "Livraison à reprogrammer",
  annulee: "Livraison annulée",
};

function vehicleLabel(value: string): string {
  return value.charAt(0).toLocaleUpperCase("fr-FR") + value.slice(1);
}

function formatEventTime(value: string | null): string | null {
  if (!value) return null;
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function LivraisonCard({
  delivery,
  isConfirming,
  onConfirm,
}: {
  delivery: ClientDelivery;
  isConfirming: boolean;
  onConfirm: () => void;
}) {
  const driver = delivery.driver;
  const events = [
    { label: "Assignée", value: delivery.assignedAt },
    { label: "Départ", value: delivery.startedAt },
    { label: "Remise", value: delivery.completedAt },
  ].filter((event) => event.value);

  const requestConfirmation = () => {
    Alert.alert(
      "Confirmer la remise",
      "Confirmez uniquement lorsque vous avez reçu votre commande.",
      [
        { text: "Pas encore", style: "cancel" },
        { text: "Commande reçue", onPress: onConfirm },
      ],
    );
  };

  return (
    <View className="mt-6 rounded-3xl border border-green-100 bg-green-50 p-5">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-ink-900">
            Suivi de la livraison
          </Text>
          <Text className="mt-1 font-semibold text-green-800">
            {DELIVERY_LABELS[delivery.status]}
          </Text>
        </View>
        <View className="h-11 w-11 items-center justify-center rounded-full bg-white">
          <Truck size={21} color={theme.green800} />
        </View>
      </View>

      {driver ? (
        <View className="mt-5 rounded-2xl bg-white p-4">
          <View className="flex-row items-center">
            <Image
              source={
                driver.photoUrl
                  ? { uri: driver.photoUrl }
                  : require("@/assets/images/livreur-profile.png")
              }
              className="h-14 w-14 rounded-full bg-gray-100"
              resizeMode="cover"
            />
            <View className="ml-3 flex-1">
              <Text className="font-bold text-ink-900">{driver.name}</Text>
              <Text className="mt-0.5 text-sm text-ink-500">
                Livreur · {driver.restaurantName}
              </Text>
            </View>
            <Pressable
              className="h-11 w-11 items-center justify-center rounded-full bg-green-50"
              accessibilityRole="button"
              accessibilityLabel={`Appeler ${driver.name}`}
              onPress={() => void Linking.openURL(`tel:${driver.phone}`)}
            >
              <Phone size={19} color={theme.green800} />
            </Pressable>
          </View>

          <View className="mt-4 flex-row items-center">
            <Bike size={18} color={theme.ink500} />
            <Text className="ml-2 text-sm text-ink-600">
              {vehicleLabel(driver.vehicle)}
              {driver.vehicleNumber ? ` · ${driver.vehicleNumber}` : ""}
            </Text>
          </View>
        </View>
      ) : (
        <Text className="mt-4 text-sm leading-5 text-ink-600">
          Le restaurant recherche un livreur. Ses informations apparaîtront ici
          dès son assignation.
        </Text>
      )}

      {events.length > 0 ? (
        <View className="mt-4 gap-2 rounded-2xl bg-white p-4">
          {events.map((event) => (
            <View
              className="flex-row items-center justify-between"
              key={event.label}
            >
              <View className="flex-row items-center">
                <Clock3 size={16} color={theme.ink500} />
                <Text className="ml-2 text-sm text-ink-500">
                  {event.label}
                </Text>
              </View>
              <Text className="text-sm font-medium text-ink-800">
                {formatEventTime(event.value)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {delivery.proofRequired ? (
        <View className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <View className="flex-row items-center">
            <ShieldCheck size={20} color="#92400E" />
            <Text className="ml-2 font-bold text-amber-900">
              Code de remise
            </Text>
          </View>
          {delivery.proofCode ? (
            <Text
              className="my-3 text-center text-3xl font-extrabold tracking-[8px] text-amber-950"
              selectable
            >
              {delivery.proofCode}
            </Text>
          ) : null}
          <Text className="text-sm leading-5 text-amber-900">
            Communiquez ce code au livreur uniquement lorsque la commande vous
            est remise, ou confirmez vous-même la réception.
          </Text>
          <Button
            className="mt-4"
            disabled={isConfirming}
            onPress={requestConfirmation}
            accessibilityLabel="Confirmer que la commande a été reçue"
          >
            {isConfirming ? (
              <ActivityIndicator color="white" />
            ) : (
              <ButtonText>J’ai reçu ma commande</ButtonText>
            )}
          </Button>
        </View>
      ) : delivery.status === "en_route" ? (
        <View className="mt-4 flex-row items-center rounded-2xl bg-white p-4">
          <CheckCircle2 size={20} color="#15803D" />
          <Text className="ml-2 flex-1 text-sm font-medium text-green-800">
            Remise confirmée. Le livreur finalise la livraison.
          </Text>
        </View>
      ) : delivery.completedAt ? (
        <View className="mt-4 flex-row items-center rounded-2xl bg-white p-4">
          <CheckCircle2 size={20} color="#15803D" />
          <Text className="ml-2 flex-1 text-sm font-medium text-green-800">
            Commande remise avec succès.
          </Text>
        </View>
      ) : null}
    </View>
  );
}
