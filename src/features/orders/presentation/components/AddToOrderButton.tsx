import { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { colors, spacing } from '../../../../shared/presentation/theme';
import type { OrderLine } from '../../domain/entities/TableOrder';

/** Agrega un platillo al pedido en curso de la mesa. */
export function AddToOrderButton({
  dish,
  disabled,
}: {
  dish: Omit<OrderLine, 'quantity'>;
  disabled?: boolean;
}) {
  const { currentOrderStore } = useDependencies();
  const [added, setAdded] = useState(0);

  const add = () => {
    currentOrderStore.getState().add(dish);
    setAdded((n) => n + 1);
  };

  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={add}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Agregar al pedido"
      accessibilityState={{ disabled }}
    >
      <Text style={styles.text}>
        {added > 0 ? `Agregado (${added}) · Agregar otro` : 'Agregar al pedido'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
  text: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
