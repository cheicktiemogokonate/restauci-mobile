import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import type { Restaurant } from '@/types';

// ============================================
// Composant HeaderRestaurant — en-tête
// ============================================
interface HeaderRestaurantProps {
  restaurant: Restaurant;
  onItineraire?: () => void;
}

const MODE_LABELS: Record<string, string> = {
  livraison: 'Livraison',
  emporter: 'Emporter',
  surplace: 'Sur place',
};

const MODE_COLORS: Record<string, string> = {
  livraison: '#3b82f6',
  emporter: '#f59e0b',
  surplace: '#22c55e',
};

const BLUR_HASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export const HeaderRestaurant: React.FC<HeaderRestaurantProps> = ({
  restaurant,
  onItineraire,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.logoContainer}>
          {restaurant.logoUrl ? (
            <Image
              source={restaurant.logoUrl}
              style={styles.logo}
              placeholder={{ blurhash: BLUR_HASH }}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={styles.logoEmoji}>🍽</Text>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.nom}>{restaurant.nom}</Text>
          {restaurant.description && (
            <Text style={styles.description} numberOfLines={2}>
              {restaurant.description}
            </Text>
          )}
        </View>

        {onItineraire && (
          <TouchableOpacity
            style={styles.itineraireButton}
            onPress={onItineraire}
            activeOpacity={0.7}
          >
            <Text style={styles.itineraireIcon}>📍</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.modesRow}>
        {restaurant.modesCommande.map((mode) => (
          <View
            key={mode}
            style={[
              styles.badge,
              { backgroundColor: `${MODE_COLORS[mode] ?? '#6b7280'}18` },
            ]}
          >
            <Text
              style={[styles.badgeText, { color: MODE_COLORS[mode] ?? '#6b7280' }]}
            >
              {MODE_LABELS[mode] ?? mode}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomColor: '#f3f4f6',
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  logoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 26,
  },
  info: {
    flex: 1,
    marginRight: 8,
  },
  nom: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  itineraireButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itineraireIcon: {
    fontSize: 20,
  },
  modesRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default HeaderRestaurant;