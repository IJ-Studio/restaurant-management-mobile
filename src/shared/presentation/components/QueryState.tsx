import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
  loadingLabel?: string;
}

/** Estados de carga y error de una consulta, iguales en todas las pantallas. */
export function QueryState({ isLoading, error, onRetry, loadingLabel = 'Cargando' }: Props) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel={loadingLabel} />
      </View>
    );
  }
  if (!error) return null;
  return (
    <View style={styles.center}>
      <Text style={styles.error} accessibilityRole="alert">
        {error}
      </Text>
      {onRetry ? (
        <Pressable onPress={onRetry} accessibilityRole="button" style={styles.retry}>
          <Text style={styles.retryText}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  error: { color: '#b00020', textAlign: 'center' },
  retry: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1, borderColor: '#1f6feb' },
  retryText: { color: '#1f6feb', fontWeight: '600' },
});
