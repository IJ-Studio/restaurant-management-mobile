import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { Card } from '../../../../shared/presentation/components/Card';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { lowStock } from '../../../kitchen/domain/Kitchen';

/** Existencias (paridad con Inventario de la web, solo consulta): primero lo que está en su mínimo. */
export function StockScreen() {
  const { listInventoryProductsUseCase } = useDependencies();
  const products = useQuery({
    queryKey: ['admin-stock'],
    queryFn: () => listInventoryProductsUseCase.execute(),
  });

  if (products.isLoading) return <LoadingState message="Cargando las existencias…" />;
  if (products.error)
    return (
      <ErrorState
        message={userMessage(products.error, 'No se pudieron cargar las existencias.')}
        onRetry={products.refetch}
      />
    );
  const all = products.data ?? [];
  const low = lowStock(all);
  const lowIds = new Set(low.map((p) => p.id));
  const ordered = [
    ...low,
    ...all.filter((p) => !lowIds.has(p.id)).sort((a, b) => a.name.localeCompare(b.name, 'es')),
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void products.refetch()} />}
    >
      <Text
        style={styles.hint}
      >{`${low.length} en su mínimo o por debajo, de ${all.length} productos. Las entradas y los proveedores se registran en la web.`}</Text>
      {ordered.map((p) => (
        <Card key={p.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{p.name}</Text>
            {p.minStock > 0 && (
              <StatusBadge
                label={lowIds.has(p.id) ? 'Bajo' : 'Bien'}
                tone={lowIds.has(p.id) ? 'danger' : 'success'}
              />
            )}
          </View>
          <Text style={styles.hint}>
            {`Quedan ${p.stock} ${p.unit}${p.minStock > 0 ? ` · mínimo ${p.minStock}` : ''}${p.category ? ` · ${p.category}` : ''}`}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { gap: spacing.xs },
  name: { ...typography.subheading, color: colors.text, flexShrink: 1 },
  hint: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});
