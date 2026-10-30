import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Chip } from '../../../../shared/presentation/components/Chip';
import { EmptyState } from '../../../../shared/presentation/components/EmptyState';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { colors, spacing } from '../../../../shared/presentation/theme';
import { RECENT_RESERVATIONS_DAYS } from '../../domain/usecases/ListRecentReservationsUseCase';
import { ReservationCard } from '../components/ReservationCard';
import type { ReservationsStackParamList } from '../navigation/ReservationsNavigator';
import { useActiveReservations } from '../viewmodels/useActiveReservations';
import { useRecentReservations } from '../viewmodels/useRecentReservations';

type ListView = 'active' | 'recent';

export function ReservationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ReservationsStackParamList>>();
  const { params } = useRoute<RouteProp<ReservationsStackParamList, 'ReservationsList'>>();
  const [view, setView] = useState<ListView>('active');
  const active = useActiveReservations();
  const recent = useRecentReservations(view === 'recent');
  const vm = view === 'active' ? active : recent;

  const empty =
    view === 'active' ? (
      <EmptyState
        message="No hay reservaciones activas."
        action={{ label: 'Ver las recientes', onPress: () => setView('recent') }}
      />
    ) : (
      <EmptyState message={`No hubo reservaciones en los últimos ${RECENT_RESERVATIONS_DAYS} días.`} />
    );

  let content;
  if (vm.isLoading) {
    content = <LoadingState message="Cargando reservaciones…" />;
  } else if (vm.errorMessage && !vm.hasData) {
    content = <ErrorState message={vm.errorMessage} onRetry={vm.refresh} />;
  } else {
    content = (
      <FlatList
        data={vm.reservations}
        keyExtractor={(reservation) => reservation.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ReservationCard reservation={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={
          vm.errorMessage ? (
            <Notice message={`No se pudo actualizar: ${vm.errorMessage}`} style={styles.notice} />
          ) : undefined
        }
        ListEmptyComponent={empty}
        refreshControl={
          <RefreshControl
            refreshing={vm.isRefreshing}
            tintColor={colors.brand}
            onRefresh={async () => {
              await vm.refresh();
            }}
          />
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Button label="Nueva reservación" onPress={() => navigation.navigate('NewReservation')} />
        <View style={styles.views} accessibilityRole="radiogroup">
          <Chip label="Próximas" selected={view === 'active'} onPress={() => setView('active')} />
          <Chip
            label={`Recientes (${RECENT_RESERVATIONS_DAYS} días)`}
            accessibilityLabel="Recientes"
            selected={view === 'recent'}
            onPress={() => setView('recent')}
          />
        </View>
        {params?.notice && <Notice tone="success" message={params.notice} style={styles.notice} />}
      </View>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  top: { padding: spacing.lg, paddingBottom: spacing.sm },
  views: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  notice: { marginTop: spacing.md },
  list: { padding: spacing.lg, paddingTop: spacing.sm, flexGrow: 1 },
  separator: { height: spacing.md },
});
