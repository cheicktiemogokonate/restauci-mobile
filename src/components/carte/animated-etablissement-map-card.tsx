import {
  EtablissementMapCard,
} from "@/components/carte/etablissement-map-card";
import type { Etablissement } from "@/types/etablissement";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

export interface AnimatedEtablissementMapCardProps {
  isFavorite?: boolean;
  onClose: () => void;
  onItineraire?: (item: Etablissement) => void;
  onOpen: (item: Etablissement) => void;
  onToggleFavorite?: (item: Etablissement) => void;
  etablissement: Etablissement;
}

export function AnimatedEtablissementMapCard({
  isFavorite,
  onClose,
  onItineraire,
  onOpen,
  onToggleFavorite,
  etablissement,
}: AnimatedEtablissementMapCardProps) {
  return (
    <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOutDown.duration(140)}>
      <EtablissementMapCard
        etablissement={etablissement}
        onPress={onOpen}
        onClose={onClose}
        onItineraire={onItineraire}
        onToggleFavorite={onToggleFavorite}
        isFavorite={isFavorite}
      />
    </Animated.View>
  );
}

export const AnimatedRestaurantMapCard = AnimatedEtablissementMapCard;
