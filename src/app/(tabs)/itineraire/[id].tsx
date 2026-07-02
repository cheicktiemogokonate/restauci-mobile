import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// ============================================
// Écran Itinéraire — placeholder
// Sera développé dans le sprint E07
// ============================================
export default function ItineraireScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.emoji}>🗺</Text>
      <Text style={styles.title}>Itinéraire</Text>
      <Text style={styles.subtitle}>Restaurante ID : {id ?? '—'}</Text>
      <Text style={styles.hint}>Fonctionnalité en cours de développement</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 32,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  hint: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
