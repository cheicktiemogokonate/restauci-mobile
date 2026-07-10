import {
  CheckCircle2,
  ClipboardList,
  Clock,
  XCircle,
} from "lucide-react-native";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { Filtre } from "./CommandeCard";

export const FILTRES: { key: Filtre; label: string; Icon: typeof ClipboardList }[] = [
  { key: "toutes", label: "Toutes", Icon: ClipboardList },
  { key: "en_cours", label: "En cours", Icon: Clock },
  { key: "livrees", label: "Livrées", Icon: CheckCircle2 },
  { key: "annulees", label: "Annulées", Icon: XCircle },
];

interface CommandeFiltresProps {
  filtreActif: Filtre;
  onSelectFiltre: (filtre: Filtre) => void;
}

export function CommandeFiltres({ filtreActif, onSelectFiltre }: CommandeFiltresProps) {
  return (
    <FlatList
      horizontal
      data={FILTRES}
      keyExtractor={(f) => f.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      style={{ flexGrow: 0, marginTop: 12, marginBottom: 6, }}
      renderItem={({ item: f }) => {
        const estActif = filtreActif === f.key;
        return (
          <TouchableOpacity
            onPress={() => onSelectFiltre(f.key)}
            className={`flex-row items-center rounded-full px-4 py-3 justify-center ${estActif ? "bg-green-900" : "bg-gray-100"}`}
          >
            <f.Icon size={15} color={estActif ? "#FFFFFF" : "#4B5563"} />
            <Text
              className={`ml-2 -mt-1 font-semibold text-sm ${estActif ? "text-white" : "text-gray-600"
                }`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}
