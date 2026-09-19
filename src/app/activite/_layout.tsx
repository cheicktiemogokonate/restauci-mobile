import { Stack } from "expo-router/stack";

export default function ActivityStackLayout() {
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: "transparent" },
        headerShown: false,
      }}
    >
      <Stack.Screen name="historique" />
    </Stack>
  );
}
