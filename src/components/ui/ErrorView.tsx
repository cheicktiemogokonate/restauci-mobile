import { Button } from "@/components/ui/button";
import { Text as ButtonText } from "@/components/ui/text";
import { ErrorViewProps } from "@/types";
import { useRouter } from "expo-router";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

export const ErrorView: React.FC<ErrorViewProps> = ({
  message = "Une erreur est survenue",
  onRetry,
  title,
  showRetry = true,
}) => {
  const router = useRouter();

  return (
    <View className="flex-1 justify-center items-center px-8 pb-12">
      <Text className="text-6xl mb-4">😕</Text>
      <Text className="text-xl font-bold text-ink-900 mb-2 text-center">
        {title ?? "Oups"}
      </Text>
      <Text className="text-sm text-ink-500 text-center leading-5 mb-6">
        {message}
      </Text>
      <View className="gap-3 w-full max-w-60">
        {showRetry && onRetry && (
          <Button
            className="py-3.5 items-center"
            onPress={onRetry}
          >
            <ButtonText className="text-white text-base font-bold">
              Réessayer
            </ButtonText>
          </Button>
        )}
        <TouchableOpacity
          className="bg-ink-100 rounded-2xl py-3.5 items-center"
          onPress={() => router.push("/(tabs)")}
        >
          <Text className="text-ink-700 text-base font-semibold">
            Retour à la carte
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ErrorView;
