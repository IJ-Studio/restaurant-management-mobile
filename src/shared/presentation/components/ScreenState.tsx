import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

type Props =
  | { kind: 'loading'; message?: string }
  | { kind: 'error'; message: string; onRetry?: () => void }
  | { kind: 'empty'; message: string };

/** Estados de pantalla comunes: cargando, error con reintento y vacío. */
export function ScreenState(props: Props) {
  return (
    <View style={styles.container}>
      {props.kind === 'loading' && <ActivityIndicator size="large" color={colors.primary} />}
      {props.message && (
        <Text
          style={[styles.message, props.kind === 'error' && styles.error]}
          accessibilityRole={props.kind === 'error' ? 'alert' : undefined}
        >
          {props.message}
        </Text>
      )}
      {props.kind === 'error' && props.onRetry && (
        <Pressable style={styles.button} onPress={props.onRetry} accessibilityRole="button">
          <Text style={styles.buttonText}>Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  message: { marginTop: spacing.md, fontSize: 15, color: colors.muted, textAlign: 'center' },
  error: { color: colors.danger },
  button: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  buttonText: { color: colors.primary, fontWeight: '600' },
});
