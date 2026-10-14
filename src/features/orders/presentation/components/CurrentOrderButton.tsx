import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '../../../../shared/presentation/theme';
import { itemCount } from '../../domain/entities/TableOrder';
import { useCurrentOrder } from '../viewmodels/useCurrentOrder';

/** Botón del encabezado del menú con el número de platillos del pedido en curso. */
export function CurrentOrderButton({ onPress }: { onPress: () => void }) {
  const count = useCurrentOrder((state) => itemCount(state.order));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Pedido de la mesa, ${count} platillos`}
      hitSlop={8}
    >
      <Text style={styles.text}>Pedido ({count})</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { color: colors.primary, fontWeight: '600', fontSize: 16 },
});
