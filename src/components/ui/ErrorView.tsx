import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
  title?: string;
  showRetry?: boolean;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  message = "Une erreur est survenue",
  onRetry,
  title,
  showRetry = true,
}) => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>😕</Text>
      <Text style={styles.title}>{title ?? "Oups"}</Text>
      <Text style={styles.message}>{message}</Text>
      <View style={styles.actions}>
        {showRetry && onRetry && (
          <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => router.push("/(tabs)")}
        >
          <Text style={styles.homeText}>Retour à la carte</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  actions: {
    gap: 12,
    width: "100%",
    maxWidth: 240,
  },
  retryButton: {
    backgroundColor: "#22c55e",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  homeButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  homeText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default ErrorView;