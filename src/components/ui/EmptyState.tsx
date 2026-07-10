import { useRouter } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

interface EmptyStateProps {
  emoji?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState(props: EmptyStateProps) {
  const router = useRouter();
  const { emoji = "📭", title, message, actionLabel, onAction } = props;

  const handlePress = () => {
    if (onAction) {
      onAction();
    } else {
      router.back();
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-8 pb-12">
      <Text className="text-6xl mb-4">{emoji}</Text>
      <Text className="text-lg font-bold text-ink-900 mb-2 text-center">
        {title}
      </Text>
      {message ? (
        <Text className="text-sm text-ink-500 text-center leading-5 mb-5">
          {message}
        </Text>
      ) : null}
      {actionLabel ? (
        <TouchableOpacity
          className="bg-green-500 rounded-2xl py-3 px-6"
          onPress={handlePress}
        >
          <Text className="text-white text-sm font-bold">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default EmptyState;
