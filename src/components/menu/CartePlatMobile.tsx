import { useStore } from '@/store';
import type { Plat } from '@/types';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ============================================
// Composant CartePlatMobile — carte menu
// ============================================
interface CartePlatMobileProps {
  plat: Plat;
  onAjouter: (plat: Plat) => void;
  onRetirer: (platId: string) => void;
}

const BLUR_HASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export const CartePlatMobile: React.FC<CartePlatMobileProps> = ({
  plat,
  onAjouter,
  onRetirer,
}) => {
  const items = useStore((s) => s.items);
  const cartItem = useMemo(
    () => items.find((item) => item.platId === plat.id),
    [items, plat.id]
  );
  const quantite = cartItem?.quantite ?? 0;

  const prixFormate = useMemo(() => {
    return new Intl.NumberFormat('fr-FR').format(plat.prix) + ' FCFA';
  }, [plat.prix]);

  const handleAdd = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAjouter(plat);
  }, [onAjouter, plat]);

  const handleRemove = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetirer(plat.id);
  }, [onRetirer, plat.id]);

  const estIndisponible = !plat.disponible;

  return (
    <View style={[styles.card, estIndisponible && styles.cardDisabled]}>
      <View style={styles.imageContainer}>
        {plat.photoUrl ? (
          <Image
            source={plat.photoUrl}
            style={styles.image}
            placeholder={{ blurhash: BLUR_HASH }}
            contentFit="cover"
            transition={300}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>🍽</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <View style={styles.textBlock}>
            <Text style={[styles.nom, estIndisponible && styles.textDisabled]} numberOfLines={1}>
              {plat.nom}
            </Text>
            {plat.description && (
              <Text
                style={[styles.description, estIndisponible && styles.textDisabled]}
                numberOfLines={1}
              >
                {plat.description}
              </Text>
            )}
            <Text style={[styles.prix, estIndisponible && styles.textDisabled]}>
              {prixFormate}
            </Text>
          </View>

          {estIndisponible ? (
            <View style={styles.badgeIndisponible}>
              <Text style={styles.badgeIndisponibleText}>Indisponible</Text>
            </View>
          ) : quantite > 0 ? (
            <View style={styles.quantiteRow}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={handleRemove}
                activeOpacity={0.6}
              >
                <Text style={styles.qtyButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyValue}>{quantite}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={handleAdd}
                activeOpacity={0.6}
              >
                <Text style={styles.qtyButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
              activeOpacity={0.6}
            >
              <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  imageContainer: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 28,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textBlock: {
    flex: 1,
    marginRight: 8,
    gap: 2,
  },
  nom: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  description: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  prix: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
    marginTop: 2,
  },
  textDisabled: {
    color: '#9ca3af',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 22,
  },
  quantiteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 20,
    paddingHorizontal: 2,
    gap: 4,
  },
  qtyButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    lineHeight: 20,
  },
  qtyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
    minWidth: 20,
    textAlign: 'center',
  },
  badgeIndisponible: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  badgeIndisponibleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
  },
});

export default CartePlatMobile;