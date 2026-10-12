import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../../../shared/presentation/components/Badge';
import { ListItem } from '../../../../shared/presentation/components/ListItem';
import { QueryState } from '../../../../shared/presentation/components/QueryState';
import { formatDateTime } from '../../../../shared/presentation/format';
import type { ReservationsStackParamList } from '../navigation/ReservationsStack';
import { useActiveReservations } from '../viewmodels/useActiveReservations';

type Props = NativeStackScreenProps<ReservationsStackParamList, 'ReservationList'>;

const people = (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`;

/** Vista operativa: reservaciones activas del restaurante, de la más próxima a la más lejana. */
export function ReservationsScreen({ navigation }: Props) {
  const { reservations, isLoading, isRefreshing, error, refresh } = useActiveReservations();

  return (
    <View style={styles.flex}>
      {/* Fuera de la lista: el botón no se vuelve a montar al terminar de cargar. */}
      <View style={styles.header}>
        <Pressable
          style={styles.newButton}
          onPress={() => navigation.navigate('ReservationForm')}
          accessibilityRole="button"
        >
          <Text style={styles.newButtonText}>Nueva reservación</Text>
        </Pressable>
      </View>
      {isLoading || (error && reservations.length === 0) ? (
        <QueryState isLoading={isLoading} error={error} onRetry={refresh} loadingLabel="Cargando reservaciones" />
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          refreshing={isRefreshing}
          onRefresh={refresh}
          ListEmptyComponent={<Text style={styles.empty}>No hay reservaciones activas.</Text>}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <ListItem
              title={item.customerName}
              subtitle={[people(item.partySize), item.notes].filter(Boolean).join(' · ')}
              trailing={formatDateTime(item.dateTime)}
              badges={
                item.status === 'pendiente' ? (
                  <Badge label="Por confirmar" />
                ) : (
                  <Badge label="Confirmada" tone="success" />
                )
              }
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { padding: 16, paddingBottom: 0 },
  list: { padding: 16, paddingTop: 0 },
  separator: { height: 8 },
  empty: { textAlign: 'center', color: '#777', marginTop: 32 },
  newButton: { backgroundColor: '#1f6feb', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginBottom: 12 },
  newButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
