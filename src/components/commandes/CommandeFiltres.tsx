import {
  CheckCircle2,
  ClipboardList,
  Clock,
  XCircle,
} from "lucide-react-native";
import { FlatList, Text, TouchableOpacity } from "react-native";
import { Filtre } from "./CommandeCard";

export const FILTRES: {
  key: Filtre;
  label: string;
  Icon: typeof ClipboardList;
}[] = [
    { key: "toutes", label: "Toutes", Icon: ClipboardList },
    { key: "en_cours", label: "En cours", Icon: Clock },
    { key: "livrees", label: "Livrées", Icon: CheckCircle2 },
    { key: "annulees", label: "Annulées", Icon: XCircle },
  ];

export const FILTRES_HISTORIQUE = FILTRES.filter(
  ({ key }) => key !== "en_cours",
);

interface CommandeFiltresProps {
  filtreActif: Filtre;
  onSelectFiltre: (filtre: Filtre) => void;
  filtres?: typeof FILTRES;
}

export function CommandeFiltres({
  filtreActif,
  onSelectFiltre,
  filtres = FILTRES,
}: CommandeFiltresProps) {
  return (
    <FlatList
      horizontal
      data={filtres}
      keyExtractor={(f) => f.key}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        gap: 8,
        alignItems: "center",
      }}
      style={{
        flexGrow: 0,
        overflow: "visible",
        marginTop: 12,
        marginBottom: 6,
      }}
      renderItem={({ item: f }) => {
        const estActif = filtreActif === f.key;
        return (
          <TouchableOpacity
            onPress={() => onSelectFiltre(f.key)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: estActif ? "#14532d" : "#f3f4f6",
            }}
          >
            <f.Icon size={15} color={estActif ? "#FFFFFF" : "#4B5563"} />
            <Text
              style={{
                marginLeft: 6,
                fontWeight: "600",
                fontSize: 13,
                lineHeight: 16,
                color: estActif ? "#FFFFFF" : "#4B5563",
              }}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}
