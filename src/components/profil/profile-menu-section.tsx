import { Link, type Href } from "expo-router";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

export interface ProfileMenuItem {
  badge?: number;
  description: string;
  icon: LucideIcon;
  label: string;
  route: Href;
  status?: string;
}

interface ProfileMenuSectionProps {
  items: ProfileMenuItem[];
  title: string;
}

export function ProfileMenuSection({
  items,
  title,
}: ProfileMenuSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.surface}>
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link key={item.label} href={item.route} asChild>
              <Pressable
                accessibilityLabel={`${item.label}. ${item.description}`}
                accessibilityRole="button"
                style={StyleSheet.flatten([
                  styles.row,
                  index < items.length - 1 && styles.rowWithSeparator,
                ])}
              >
                <View style={styles.iconTile}>
                  <Icon color="theme.brandDark" size={21} strokeWidth={1.9} />
                </View>

                <View style={styles.copy}>
                  <View style={styles.labelLine}>
                    <Text numberOfLines={1} style={styles.label}>
                      {item.label}
                    </Text>
                    {!!item.status && (
                      <View style={styles.statusPill}>
                        <Text style={styles.statusLabel}>{item.status}</Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} style={styles.description}>
                    {item.description}
                  </Text>
                </View>

                {!!item.badge && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeLabel}>
                      {item.badge > 99 ? "99+" : item.badge}
                    </Text>
                  </View>
                )}
                <ChevronRight color="#777C78" size={20} strokeWidth={1.9} />
              </Pressable>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    backgroundColor: "theme.brandDark",
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 20,
    minWidth: 20,
    paddingHorizontal: 6,
  },
  badgeLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  copy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  description: {
    color: "theme.ink500",
    fontSize: 12,
    lineHeight: 16,
  },
  iconTile: {
    alignItems: "center",
    backgroundColor: "theme.green50",
    borderRadius: 12,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  label: {
    color: "theme.ink900",
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  labelLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rowWithSeparator: {
    borderBottomColor: "theme.ink100",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    color: "theme.ink900",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
    paddingHorizontal: 2,
  },
  statusLabel: {
    color: "theme.ink500",
    fontSize: 10.5,
    fontWeight: "600",
  },
  statusPill: {
    backgroundColor: "theme.ink100",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  surface: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(0,0,0,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
    overflow: "hidden",
  },
});
