import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, sizes, spacing, typography } from '../theme';
import { Button } from './Button';

interface Props {
  message: string;
  onRetry?: () => void;
}

/** Error a pantalla completa: ícono, mensaje (anunciado como alerta) y botón de reintento. */
export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={styles.iconText}>!</Text>
      </View>
      <Text style={styles.message} accessibilityRole="alert">
        {message}
      </Text>
      {onRetry && <Button label="Reintentar" onPress={onRetry} variant="outline" style={styles.retry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  icon: {
    width: sizes.control,
    height: sizes.control,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { ...typography.title, color: colors.danger },
  message: {
    ...typography.bodyStrong,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.lg,
    maxWidth: 320,
  },
  retry: { marginTop: spacing.xl, minWidth: 180 },
});
