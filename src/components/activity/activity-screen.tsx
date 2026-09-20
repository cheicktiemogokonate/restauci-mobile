import { ActivityListRow } from "@/components/activity/activity-list-row";
import { ActivityNowCarousel } from "@/components/activity/activity-now-carousel";
import { buildActivityFeed, type ActivityItem } from "@/domain/activity";
import { useCommandesClient } from "@/hooks/useCommandesClient";
import { useClientReservations } from "@/hooks/useResidences";
import { useStore } from "@/store";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  ChevronRight,
  Clock3,
  Compass,
  History,
} from "lucide-react-native";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useReducedMotion,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

const UPCOMING_PREVIEW_LIMIT = 2;
const RECENT_PREVIEW_LIMIT = 3;

function pluralizedSummary(now: number, upcoming: number): string {
  return `${now} en cours · ${upcoming} à venir`;
}

function ActivityHeader({ now, upcoming }: { now: number; upcoming: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeIn.duration(220)} style={styles.header}>
      <Text style={styles.screenTitle}>Activité</Text>
      <Text style={styles.screenSummary}>
        {pluralizedSummary(now, upcoming)}
      </Text>
    </Animated.View>
  );
}

function SectionHeader({
  actionLabel,
  onAction,
  title,
}: {
  actionLabel?: string;
  onAction?: () => void;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction && (
        <Pressable
          accessibilityRole="button"
          hitSlop={10}
          onPress={onAction}
          style={styles.sectionAction}
        >
          <Text style={styles.sectionActionLabel}>{actionLabel}</Text>
          <ChevronRight color="#4F504C" size={17} strokeWidth={2.2} />
        </Pressable>
      )}
    </View>
  );
}

function ActivityRows({
  items,
  onPress,
  variant,
}: {
  items: ActivityItem[];
  onPress: (item: ActivityItem) => void;
  variant: "recent" | "upcoming";
}) {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInDown.duration(220)}
      style={styles.rowsSurface}
    >
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
    </Animated.View>
  );
}

function HistoryAccess({
  count,
  onPress,
}: {
  count: number;
  onPress: () => void;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <Animated.View entering={reduceMotion ? undefined : FadeInDown.duration(220)}>
      <Pressable
        accessibilityLabel={`Ouvrir l'historique, ${count} activité${count > 1 ? "s" : ""}`}
        accessibilityRole="button"
        onPress={onPress}
        style={styles.historyCard}
      >
        <View style={styles.historyIcon}>
          <History color={theme.brandDark} size={20} strokeWidth={2} />
        </View>
        <View style={styles.historyCopy}>
          <Text style={styles.historyTitle}>Toutes les activités</Text>
          <Text style={styles.historySubtitle}>
            {count} activité{count > 1 ? "s" : ""} passée
            {count > 1 ? "s" : ""}
          </Text>
        </View>
        <ChevronRight color="#94A3B8" size={20} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

function ActivityEmpty({ onExplore }: { onExplore: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Clock3 color={theme.green900} size={30} strokeWidth={1.8} />
      </View>
      <Text style={styles.emptyTitle}>Aucune activité pour le moment</Text>
      <Text style={styles.emptyMessage}>
        Vos commandes et réservations apparaîtront ici.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onExplore}
        style={styles.primaryButton}
      >
        <Compass color="#FFFFFF" size={18} strokeWidth={2} />
        <Text style={styles.primaryButtonLabel}>Explorer les établissements</Text>
      </Pressable>
    </View>
  );
}

function ActivityLogin({ onLogin }: { onLogin: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Clock3 color={theme.green900} size={30} strokeWidth={1.8} />
      </View>
      <Text style={styles.emptyTitle}>Retrouvez toute votre activité</Text>
      <Text style={styles.emptyMessage}>
        Connectez-vous pour suivre vos commandes et vos séjours.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onLogin}
        style={styles.primaryButton}
      >
        <Text style={styles.primaryButtonLabel}>Se connecter</Text>
      </Pressable>
    </View>
  );
}

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const client = useStore((state) => state.client);
  const orders = useCommandesClient({ limit: 20 });
  const reservations = useClientReservations();

  const feed = useMemo(
    () => buildActivityFeed(orders.data, reservations.data ?? []),
    [orders.data, reservations.data],
  );

  const handleRefresh = useCallback(async () => {
    await Promise.all([orders.refetch(), reservations.refetch()]);
  }, [orders, reservations]);

  const openItem = useCallback(
    (item: ActivityItem) => {
      router.push(item.route);
    },
    [router],
  );

  const openActivityList = useCallback(
    (view: "history" | "upcoming") => {
      router.push({ pathname: "/activite/historique", params: { view } });
    },
    [router],
  );

  if (!client) {
    return (
      <View style={styles.page}>
        <StatusBar barStyle="dark-content" />
        <View
          style={[
            styles.authContainer,
            {
              paddingBottom: insets.bottom + 96,
              paddingTop: insets.top + 20,
            },
          ]}
        >
          <ActivityHeader now={0} upcoming={0} />
          <ActivityLogin
            onLogin={() =>
              router.push({
                pathname: "/auth/login",
                params: { redirectTo: "/(tabs)/activite" },
              })
            }
          />
        </View>
      </View>
    );
  }

  const loading = orders.isPending || reservations.isPending;
  const hasNoData = orders.data.length === 0 && !reservations.data?.length;
  const failed = Boolean(orders.error && reservations.error && hasNoData);
  const refreshing = orders.isRefetching || reservations.isRefetching;

  if (loading && hasNoData) {
    return (
      <View style={styles.page}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerState}>
          <ActivityIndicator color={theme.green900} size="large" />
          <Text style={styles.stateMessage}>Chargement de votre activité…</Text>
        </View>
      </View>
    );
  }

  if (failed) {
    return (
      <View style={styles.page}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.centerState}>
          <AlertCircle color="#B42318" size={34} strokeWidth={1.8} />
          <Text style={styles.emptyTitle}>Activité indisponible</Text>
          <Text style={styles.emptyMessage}>
            Impossible de récupérer vos commandes et réservations.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void handleRefresh()}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonLabel}>Réessayer</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const totalItems =
    feed.now.length +
    feed.upcoming.length +
    feed.recent.length +
    feed.history.length;

  return (
    <View style={styles.page}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 118,
            paddingTop: insets.top + 10,
          },
        ]}
        contentInsetAdjustmentBehavior="never"
        refreshControl={
          <RefreshControl
            onRefresh={() => void handleRefresh()}
            refreshing={refreshing}
            tintColor={theme.brandDark}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ActivityHeader now={feed.now.length} upcoming={feed.upcoming.length} />

        {totalItems === 0 ? (
          <ActivityEmpty onExplore={() => router.push("/(tabs)")} />
        ) : (
          <View style={styles.sections}>
            {feed.now.length > 0 && (
              <View>
                <SectionHeader title="En ce moment" />
                <ActivityNowCarousel items={feed.now} onPress={openItem} />
              </View>
            )}

            {feed.upcoming.length > 0 && (
              <View>
                <SectionHeader
                  actionLabel={
                    feed.upcoming.length > UPCOMING_PREVIEW_LIMIT
                      ? "Voir tout"
                      : undefined
                  }
                  onAction={() => openActivityList("upcoming")}
                  title="À venir"
                />
                <ActivityRows
                  items={feed.upcoming.slice(0, UPCOMING_PREVIEW_LIMIT)}
                  onPress={openItem}
                  variant="upcoming"
                />
              </View>
            )}

            {feed.recent.length > 0 && (
              <View>
                <SectionHeader title="Ces 7 derniers jours" />
                <ActivityRows
                  items={feed.recent.slice(0, RECENT_PREVIEW_LIMIT)}
                  onPress={openItem}
                  variant="recent"
                />
              </View>
            )}

            {feed.history.length > 0 && (
              <View>
                <SectionHeader title="Historique" />
                <HistoryAccess
                  count={feed.history.length}
                  onPress={() => openActivityList("history")}
                />
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centerState: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    paddingBottom: 90,
    paddingHorizontal: 28,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: theme.green50,
    borderCurve: "continuous",
    borderRadius: 22,
    height: 68,
    justifyContent: "center",
    width: 68,
  },
  emptyMessage: {
    color: theme.slate500,
    fontSize: 14.5,
    lineHeight: 21,
    maxWidth: 310,
    textAlign: "center",
  },
  emptyState: {
    alignItems: "center",
    flex: 1,
    gap: 10,
    justifyContent: "center",
    minHeight: 380,
    paddingBottom: 36,
  },
  emptyTitle: {
    color: "#111111",
    fontSize: 19,
    fontWeight: "800",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  header: {
    gap: 3,
    paddingBottom: 16,
  },
  historyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.06)",
    borderCurve: "continuous",
    borderRadius: 20,
    borderWidth: 1,
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    flexDirection: "row",
    gap: 14,
    minHeight: 76,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  historyCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  historyIcon: {
    alignItems: "center",
    backgroundColor: theme.green50,
    borderCurve: "continuous",
    borderRadius: 14,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  historySubtitle: {
    color: theme.slate500,
    fontSize: 13,
    fontWeight: "500",
  },
  historyTitle: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "700",
  },
  page: {
    backgroundColor: "transparent",
    flex: 1,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: theme.brandDark,
    borderCurve: "continuous",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 22,
  },
  primaryButtonLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
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
  screenSummary: {
    color: theme.slate500,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontWeight: "500",
  },
  screenTitle: {
    color: "#111111",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  sectionAction: {
    alignItems: "center",
    flexDirection: "row",
    gap: 1,
    minHeight: 44,
  },
  sectionActionLabel: {
    color: "#4F504C",
    fontSize: 13.5,
    fontWeight: "600",
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
  },
  sections: {
    gap: 18,
  },
  sectionTitle: {
    color: "#111111",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  stateMessage: {
    color: theme.slate500,
    fontSize: 14,
    fontWeight: "500",
  },
});
