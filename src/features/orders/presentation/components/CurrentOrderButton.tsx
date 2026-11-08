import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, opacity, radius, sizes, spacing, typography } from '../../../../shared/presentation/theme';
import { itemCount } from '../../domain/entities/TableOrder';
import { useCurrentOrder } from '../viewmodels/useCurrentOrder';

/** Botón del encabezado del menú con el número de platillos del pedido en curso. */
export function CurrentOrderButton({ onPress }: { onPress: () => void }) {
  const count = useCurrentOrder((state) => itemCount(state.order));
  const hasItems = count > 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Pedido de la mesa, ${count} platillos`}
      hitSlop={spacing.sm}
      style={({ pressed }) => [styles.button, hasItems && styles.active, pressed && styles.pressed]}
    >
      <Ionicons name="receipt-outline" size={18} color={hasItems ? colors.textOnBrand : colors.brandStrong} />
      <Text style={[styles.count, hasItems && styles.countActive]}>{count}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.touchTarget - spacing.sm,
    minWidth: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
  },
  active: { backgroundColor: colors.brandStrong },
  pressed: { opacity: opacity.pressed },
  count: { ...typography.bodyStrong, color: colors.brandStrong },
  countActive: { color: colors.textOnBrand },
});
