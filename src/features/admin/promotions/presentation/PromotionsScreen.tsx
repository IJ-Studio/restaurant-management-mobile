import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { feedback } from '../../../../shared/presentation/feedback';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { validity, type AdminPromotion } from '../domain/Promotions';

/** Promociones (paridad con la web): ver y activar o desactivar. Crear y editar con imagen, en la web. */
export function PromotionsScreen() {
  const { promotionsRepository } = useDependencies();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const list = useQuery({ queryKey: ['admin-promotions'], queryFn: () => promotionsRepository.list() });
  const toggle = useMutation({
    mutationFn: (p: AdminPromotion) => promotionsRepository.setActive(p.id, !p.active),
    onSuccess: (_, p) => {
      feedback.success();
      setMessage({
        tone: 'success',
        text: p.active ? `«${p.title}» ya no se muestra.` : `«${p.title}» se muestra en la página.`,
      });
      void queryClient.invalidateQueries({ queryKey: ['admin-promotions'] });
    },
    onError: (e: Error) => {
      feedback.error();
      setMessage({ tone: 'danger', text: userMessage(e, 'No se pudo cambiar la promoción.') });
    },
  });

  if (list.isLoading) return <LoadingState message="Cargando las promociones…" />;
  if (list.error)
    return (
      <ErrorState
        message={userMessage(list.error, 'No se pudieron cargar las promociones.')}
        onRetry={list.refetch}
      />
    );
  const promos = list.data ?? [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void list.refetch()} />}
    >
      <Text style={styles.hint}>
        Crear y editar (con imagen) se hace en la web; aquí se activan o desactivan.
      </Text>
      {message && <Notice tone={message.tone} message={message.text} />}
      {promos.length === 0 && <Text style={styles.hint}>Todavía no hay promociones.</Text>}
      {promos.map((p) => (
        <Card key={p.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{p.title}</Text>
            <StatusBadge label={p.active ? 'Activa' : 'Inactiva'} tone={p.active ? 'success' : 'neutral'} />
          </View>
          <Text style={styles.hint}>
            {[p.badge, p.price !== null ? formatCurrency(p.price) : null, validity(p)]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {p.description ? <Text style={styles.text}>{p.description}</Text> : null}
          <Button
            label={p.active ? 'Desactivar' : 'Activar'}
            variant="outline"
            loading={toggle.isPending && toggle.variables?.id === p.id}
            onPress={() => toggle.mutate(p)}
            accessibilityLabel={`${p.active ? 'Desactivar' : 'Activar'} «${p.title}»`}
          />
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
  text: { ...typography.body, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
});
