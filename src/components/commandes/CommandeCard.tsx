import type { CommandeSummary } from "@/types";
import {
  categorizeOrderStatus,
  getOngoingOrderMessage,
  getOrderStatusLabel,
  isTerminalOrderStatus,
  type OrderFilter,
} from "@/domain/orderStatus";
import { formatPrix } from "@/lib/format";
import {
  Bike,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  XCircle,
} from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";
import { Card } from "@/components/ui/card";

export type Filtre = OrderFilter;
export const estCommandeTerminee = isTerminalOrderStatus;
export const categoriser = categorizeOrderStatus;

interface CommandeCardProps {
  item: CommandeSummary;
  onPress: (id: string) => void;
}

export function CommandeCard({
  item,
  onPress,
}: CommandeCardProps) {
  const categorie = categoriser(item.statut);
  const totalFormate = formatPrix(item.total);
  const dateFormatee = new Date(item.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const heureFormatee = new Date(item.createdAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const nombreArticles = item.items.reduce(
    (total, article) => total + article.quantite,
    0,
  );
  const ongoingMessage = getOngoingOrderMessage(item.statut);

  const getBadgeStyle = () => {
    switch (categorie) {
      case "livrees":
        return {
          bg: "#f0fdf4",
          text: "#166534",
          iconColor: "#166534",
          Icon: CheckCircle2,
        };
      case "annulees":
        return {
          bg: "#fef2f2",
          text: "text-danger",
          iconColor: "#DC2626",
          Icon: XCircle,
        };
      default:
        return {
          bg: "bg-warning/10",
          text: "text-warning",
          iconColor: "#CA8A04",
          Icon: Clock,
        };
    }
  };

  const getBandeauStyle = () => {
    switch (categorie) {
      case "livrees":
        return {
          bg: "bg-brand-50",
          text: "text-brand-800",
          border: "border-brand-800",
          iconColor: "#166534",
          Icon: CheckCircle2,
          message: "Commandée et livrée",
          actionLabel: "Voir le détail",
          onAction: () => onPress(item.id),
        };
      case "annulees":
        return {
          bg: "bg-danger/10",
          text: "text-danger",
          border: "border-danger",
          iconColor: "#DC2626",
          Icon: XCircle,
          message: "Commande annulée",
          actionLabel: "Voir le détail",
          onAction: () => onPress(item.id),
        };
      default:
        return {
          bg: "bg-warning/10",
          text: "text-warning",
          border: "border-warning",
          iconColor: "#CA8A04",
          Icon: Bike,
          message: ongoingMessage,
          actionLabel: "Suivre ma commande",
          onAction: () => onPress(item.id),
        };
    }
  };

  const badge = getBadgeStyle();
  const bandeau = getBandeauStyle();

  return (
    <Card className="mb-4">
      <TouchableOpacity className="p-4" onPress={() => onPress(item.id)} activeOpacity={0.7}>
        <View className="flex-row">
          {/* <Image
            source={{
              uri:
                itemImage ??
                "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
            }}
            style={{ width: 72, height: 72, borderRadius: 16 }}
          /> */}
          <View className="flex-1 ml-3">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1 mr-2">
                <Text className="font-bold text-black text-base" numberOfLines={1}>
                  {`Commande ${item.numero}`}
                </Text>
                {/* <ChevronRight size={16} color="#111111" /> */}
              </View>
              <View className={`flex-row items-center rounded-full px-3 py-1 ${badge.bg}`}>
                <Text className={`font-semibold text-xs mr-1 ${badge.text}`}>
                  {getOrderStatusLabel(item.statut)}
                </Text>
                <badge.Icon size={12} color={badge.iconColor} />
              </View>
            </View>

            <Text className="text-gray-500 text-sm mt-1">
              {nombreArticles > 0
                ? `${nombreArticles} article${nombreArticles > 1 ? "s" : ""}`
                : item.modeCommande === "livraison"
                  ? "Livraison"
                  : "À emporter"}
            </Text>

            <View className="flex-row items-center mt-1">
              <Calendar size={13} color="#9CA3AF" />
              <Text className="text-gray-400 text-xs ml-1">
                {dateFormatee} • {heureFormatee}
              </Text>
            </View>

            <View className="flex-row items-center justify-between mt-2">
              <Text className="font-extrabold text-black text-base">
                {totalFormate}
              </Text>
              <View className="flex-row items-center">
                <Text className="text-brand-800 font-semibold text-sm">
                  Voir les détails
                </Text>
                <ChevronRight size={14} color="#166534" />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View className={`flex-row items-center justify-between px-4 py-3 ${bandeau.bg}`}>
        <View className="flex-row items-center flex-1 mr-2">
          <bandeau.Icon size={16} color={bandeau.iconColor} />
          <Text className={`text-sm font-medium ml-2 ${bandeau.text}`}>
            {bandeau.message}
          </Text>
        </View>
        <TouchableOpacity
          onPress={bandeau.onAction}
          className={`border rounded-full px-3 py-1.5 ${bandeau.border}`}
        >
          <Text className={`text-xs font-semibold ${bandeau.text}`}>
            {bandeau.actionLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}
