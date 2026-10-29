import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../theme';

interface Props {
  message?: string;
}

/** Indicador de carga centrado con el naranja de marca. */
export function LoadingState({ message }: Props) {
  return (
    <View style={styles.container}>
      {/* Con mensaje visible, el lector ya lo lee; sin él, el indicador se anuncia solo. */}
      <ActivityIndicator
        size="large"
        color={colors.brand}
        accessibilityLabel={message ? undefined : 'Cargando'}
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  message: { ...typography.small, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
});
