import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { Button } from '../../../../shared/presentation/components/Button';
import { spacing } from '../../../../shared/presentation/theme';
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
    <Button
      label={added > 0 ? `Agregado (${added}) · Agregar otro` : 'Agregar al pedido'}
      accessibilityLabel="Agregar al pedido"
      onPress={add}
      disabled={disabled}
      style={styles.button}
    />
  );
}

const styles = StyleSheet.create({
  button: { marginTop: spacing.xl },
});
