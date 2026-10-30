import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';

interface Props {
  message: string;
  /** Acción opcional, p. ej. "Ir al menú". */
  action?: { label: string; onPress: () => void };
}

/** Pantalla o lista sin contenido: trazo naranja de marca, mensaje y acción opcional. */
export function EmptyState({ message, action }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.mark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <Text style={styles.message}>{message}</Text>
      {action && (
        <Button label={action.label} onPress={action.onPress} variant="outline" style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  mark: { width: spacing.xxl, height: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.brand },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.lg,
    maxWidth: 320,
  },
  action: { marginTop: spacing.xl },
});
