import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';

interface Props {
  message: string;
  onRetry?: () => void;
}

const BADGE = 72;

/** Error a pantalla completa: ícono, mensaje (anunciado como alerta) y botón de reintento. */
export function ErrorState({ message, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.badge} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="cloud-offline-outline" size={32} color={colors.danger} />
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
  badge: {
    width: BADGE,
    height: BADGE,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...typography.bodyStrong,
    color: colors.danger,
    textAlign: 'center',
    marginTop: spacing.lg,
    maxWidth: 320,
  },
  retry: { marginTop: spacing.xl, minWidth: 180 },
});
