import { ActivityNowCard } from "@/components/activity/activity-now-card";
import type { ActivityItem } from "@/domain/activity";
import { useCallback, useState } from "react";
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

const CARD_GAP = 12;

interface ActivityNowCarouselProps {
  items: ActivityItem[];
  onPress: (item: ActivityItem) => void;
}

export function ActivityNowCarousel({
  items,
  onPress,
}: ActivityNowCarouselProps) {
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const cardWidth = Math.max(280, width - 48);
  const snapInterval = cardWidth + CARD_GAP;

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const nextIndex = Math.round(
        event.nativeEvent.contentOffset.x / snapInterval,
      );
      setActiveIndex(Math.min(items.length - 1, Math.max(0, nextIndex)));
    },
    [items.length, snapInterval],
  );

  return (
    <View>
      <FlatList
        contentContainerStyle={styles.content}
        data={items}
        decelerationRate="fast"
        disableIntervalMomentum
        getItemLayout={(_, index) => ({
          index,
          length: snapInterval,
          offset: snapInterval * index,
        })}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleMomentumEnd}
        renderItem={({ item }) => (
          <ActivityNowCard
            item={item}
            onPress={() => onPress(item)}
            width={cardWidth}
          />
        )}
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        snapToInterval={snapInterval}
        style={{ width: cardWidth }}
      />

      {items.length > 1 && (
        <View
          accessibilityLabel={`Élément ${activeIndex + 1} sur ${items.length}`}
          style={styles.indicatorsContainer}
        >
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                styles.indicatorDot,
                i === activeIndex && styles.indicatorDotActive,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: CARD_GAP,
  },
  indicatorDot: {
    backgroundColor: "#CBD5E1",
    borderRadius: 3,
    height: 5,
    width: 6,
  },
  indicatorDotActive: {
    backgroundColor: "theme.brandDark",
    borderRadius: 3,
    width: 18,
  },
  indicatorsContainer: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingTop: 12,
  },
});
