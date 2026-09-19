import { ActivityListRow } from "@/components/activity/activity-list-row";
import { NavigationBackButton } from "@/components/navigation/navigation-back-button";
import { buildActivityFeed, type ActivityItem } from "@/domain/activity";
import { useCommandesClient } from "@/hooks/useCommandesClient";
import { useClientReservations } from "@/hooks/useResidences";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CalendarDays } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ActivityListView = "history" | "upcoming";

interface HistoryGroup {
  key: string;
  label: string;
  items: ActivityItem[];
}

function normalizedView(value: string | string[] | undefined): ActivityListView {
  return value === "upcoming" ? "upcoming" : "history";
}

function activityMonth(item: ActivityItem): { key: string; label: string } {
  const date = new Date(item.sortAt);
  if (Number.isNaN(date.getTime())) {
    return { key: "other", label: "Autres" };
  }

  const label = date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  return {
    key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    label: label.charAt(0).toUpperCase() + label.slice(1),
  };
}

function groupHistory(items: ActivityItem[]): HistoryGroup[] {
  const groups = new Map<string, HistoryGroup>();

  for (const item of items) {
    const month = activityMonth(item);
    const current = groups.get(month.key);
    if (current) {
      current.items.push(item);
    } else {
      groups.set(month.key, {
        key: month.key,
        label: month.label,
        items: [item],
      });
    }
  }

  return [...groups.values()];
}

function ViewSelector({
  onChange,
  value,
}: {
  onChange: (value: ActivityListView) => void;
  value: ActivityListView;
}) {
  return (
    <View accessibilityRole="tablist" style={styles.selector}>
      {(
        [
          ["upcoming", "À venir"],
          ["history", "Historique"],
        ] as const
      ).map(([key, label]) => {
        const selected = key === value;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={key}
            onPress={() => onChange(key)}
            style={[styles.selectorItem, selected && styles.selectorItemActive]}
          >
            <Text
              style={[
                styles.selectorLabel,
                selected && styles.selectorLabelActive,
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function RowsGroup({
  items,
  onPress,
  variant,
}: {
  items: ActivityItem[];
  onPress: (item: ActivityItem) => void;
  variant: "history" | "upcoming";
}) {
  return (
    <View style={styles.rowsSurface}>
      {items.map((item, index) => (
        <ActivityListRow
          index={index}
          isLast={index === items.length - 1}
          item={item}
          key={item.id}
          onPress={() => onPress(item)}
          variant={variant}
        />
      ))}
    </View>
  );
}

function EmptyList({ view }: { view: ActivityListView }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <CalendarDays color="#14532D" size={27} strokeWidth={1.9} />
      </View>
      <Text style={styles.emptyTitle}>
        {view === "upcoming"
          ? "Aucune activité à venir"
          : "Votre historique est vide"}
      </Text>
    </View>
  );
}

export function ActivityListScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ view?: string | string[] }>();
  const view = normalizedView(params.view);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const orders = useCommandesClient({ limit: 20 });
  const reservations = useClientReservations();

  const feed = useMemo(
    () => buildActivityFeed(orders.data, reservations.data ?? []),
    [orders.data, reservations.data],
  );
  const historyGroups = useMemo(
    () => groupHistory(feed.history),
    [feed.history],
  );
  const visibleGroups = useMemo(
    () =>
      selectedMonth === "all"
        ? historyGroups
        : historyGroups.filter((group) => group.key === selectedMonth),
    [historyGroups, selectedMonth],
  );

  const openItem = useCallback(
    (item: ActivityItem) => {
      router.push(item.route);
    },
    [router],
  );

  const handleBack = useCallback(() => {
    router.replace("/(tabs)/activite");
  }, [router]);

  const handleViewChange = useCallback(
    (nextView: ActivityListView) => {
      setSelectedMonth("all");
      router.setParams({ view: nextView });
    },
    [router],
  );

  const loading = orders.isPending || reservations.isPending;
  const count = view === "upcoming" ? feed.upcoming.length : feed.history.length;

  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 28,
            paddingTop:
              process.env.EXPO_OS === "android" ? insets.top + 14 : 14,
          },
        ]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <NavigationBackButton
            accessibilityLabel="Revenir à l’activité"
            onPress={handleBack}
          />
          <View style={styles.titleCopy}>
            <Text style={styles.title}>Toute l’activité</Text>
            <Text style={styles.subtitle}>
              {count} élément{count > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <ViewSelector onChange={handleViewChange} value={view} />

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color="#14532D" />
          </View>
        ) : view === "upcoming" ? (
          feed.upcoming.length > 0 ? (
            <RowsGroup
              items={feed.upcoming}
              onPress={openItem}
              variant="upcoming"
            />
          ) : (
            <EmptyList view={view} />
          )
        ) : feed.history.length > 0 ? (
          <View style={styles.historyContent}>
            {historyGroups.length > 1 && (
              <ScrollView
                contentContainerStyle={styles.months}
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setSelectedMonth("all")}
                  style={[
                    styles.monthChip,
                    selectedMonth === "all" && styles.monthChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.monthLabel,
                      selectedMonth === "all" && styles.monthLabelActive,
                    ]}
                  >
                    Tout
                  </Text>
                </Pressable>
                {historyGroups.map((group) => {
                  const selected = selectedMonth === group.key;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={group.key}
                      onPress={() => setSelectedMonth(group.key)}
                      style={[
                        styles.monthChip,
                        selected && styles.monthChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.monthLabel,
                          selected && styles.monthLabelActive,
                        ]}
                      >
                        {group.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            {visibleGroups.map((group) => (
              <View key={group.key} style={styles.group}>
                <Text style={styles.groupTitle}>{group.label}</Text>
                <RowsGroup
                  items={group.items}
                  onPress={openItem}
                  variant="history"
                />
              </View>
            ))}
          </View>
        ) : (
          <EmptyList view={view} />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 22,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "rgba(222,239,223,0.8)",
    borderRadius: 22,
    height: 62,
    justifyContent: "center",
    width: 62,
  },
  emptyState: {
    alignItems: "center",
    gap: 12,
    minHeight: 300,
    paddingTop: 60,
  },
  emptyTitle: {
    color: "#111111",
    fontSize: 18,
    fontWeight: "700",
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    color: "#111111",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  historyContent: {
    gap: 18,
  },
  loadingState: {
    alignItems: "center",
    minHeight: 260,
    paddingTop: 80,
  },
  monthChip: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.66)",
    borderColor: "rgba(17,17,17,0.08)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 40,
    paddingHorizontal: 16,
  },
  monthChipActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  monthLabel: {
    color: "#555651",
    fontSize: 13,
    fontWeight: "600",
  },
  monthLabelActive: {
    color: "#FFFFFF",
  },
  months: {
    gap: 9,
    paddingRight: 24,
  },
  page: {
    backgroundColor: "transparent",
    flex: 1,
  },
  rowsSurface: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.06)",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  selector: {
    backgroundColor: "#F1F5F9",
    borderCurve: "continuous",
    borderRadius: 16,
    flexDirection: "row",
    padding: 4,
  },
  selectorItem: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    minHeight: 42,
  },
  selectorItemActive: {
    backgroundColor: "#FFFFFF",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  selectorLabel: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  selectorLabelActive: {
    color: "#111111",
  },
  subtitle: {
    color: "#6F706D",
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  title: {
    color: "#111111",
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  titleCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: 16,
  },
});
