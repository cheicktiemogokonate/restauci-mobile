import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorView } from "@/components/ui/ErrorView";
import { Text as ButtonText } from "@/components/ui/text";
import { useClientNotifications, useMarkNotificationsRead, type ClientNotification } from "@/hooks/useClientNotifications";
import { Stack, useRouter } from "expo-router";
import { Bell, ChevronLeft } from "lucide-react-native";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotificationsScreen() {
  const router = useRouter();
  const notifications = useClientNotifications();
  const markRead = useMarkNotificationsRead();

  const open = (item: ClientNotification) => {
    if (!item.read) markRead.mutate({ notificationIds: [item.id] });
    if (item.linkType === "reservation_residence" && item.linkId) router.push(`/reservations/${item.linkId}`);
    else if ((item.linkType === "commande" || item.linkType === "commande_restaurant") && item.linkId) router.push(`/(tabs)/commandes/${item.linkId}`);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-ink-50">
        <View className="flex-row items-center justify-between px-4 py-3"><Pressable onPress={() => router.back()} className="h-10 w-10 items-center justify-center rounded-full bg-white"><ChevronLeft color="#111827" /></Pressable><Text className="text-xl font-extrabold text-ink-900">Notifications</Text><View className="w-10" /></View>
        {notifications.data?.unreadCount ? <View className="px-4 pb-3"><Button variant="ghost" size="sm" onPress={() => markRead.mutate({ markAll: true })} disabled={markRead.isPending}><ButtonText className="text-brand-800">Tout marquer comme lu ({notifications.data.unreadCount})</ButtonText></Button></View> : null}
        {notifications.isPending ? <View className="flex-1 items-center justify-center"><ActivityIndicator size="large" color="#14532d" /></View> : notifications.isError ? <ErrorView message={notifications.error.message} onRetry={() => void notifications.refetch()} /> : <FlatList data={notifications.data?.items ?? []} keyExtractor={(item) => item.id} contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 10, flexGrow: 1 }} ListEmptyComponent={<EmptyState emoji="🔔" title="Aucune notification" message="Les mises à jour de vos commandes et séjours apparaîtront ici." />} renderItem={({ item }) => <Pressable onPress={() => open(item)} className={`flex-row rounded-2xl border p-4 ${item.read ? "border-ink-100 bg-white" : "border-brand-200 bg-brand-50"}`}><View className="mr-3 mt-1 h-10 w-10 items-center justify-center rounded-full bg-white"><Bell size={18} color="#14532d" /></View><View className="flex-1"><Text className="font-bold text-ink-900">{item.title}</Text><Text className="mt-1 leading-5 text-ink-600">{item.message}</Text><Text className="mt-2 text-xs text-ink-400">{new Date(item.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</Text></View>{!item.read ? <View className="mt-2 h-2.5 w-2.5 rounded-full bg-brand-700" /> : null}</Pressable>} />}
      </SafeAreaView>
    </>
  );
}
