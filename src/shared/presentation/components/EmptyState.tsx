import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { Button } from './Button';
import { DoubleRule } from './DoubleRule';

interface Props {
  message: string;
  /** Ícono ilustrativo; por defecto, un plato de restaurante. */
  icon?: ComponentProps<typeof Ionicons>['name'];
  /** Acción opcional, p. ej. "Ir al menú". */
  action?: { label: string; onPress: () => void };
}

/** Pantalla o lista sin contenido: ícono de trazo, filete doble, mensaje y acción opcional. */
export function EmptyState({ message, icon = 'restaurant-outline', action }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={icon} size={32} color={colors.brand} />
        <DoubleRule />
      </View>
      <Text style={styles.message}>{message}</Text>
      {action && (
        <Button label={action.label} onPress={action.onPress} variant="outline" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  badge: { alignItems: 'center', gap: spacing.md },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    maxWidth: 320,
  },
  action: { marginTop: spacing.xl },
});
