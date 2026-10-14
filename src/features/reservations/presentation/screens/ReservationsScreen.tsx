import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../../shared/presentation/components/Card';
import { ListItem } from '../../../../shared/presentation/components/ListItem';
import { ScreenState } from '../../../../shared/presentation/components/ScreenState';
import { colors, spacing } from '../../../../shared/presentation/theme';
import { formatDateTime } from '../../../../shared/utils/formatDateTime';
import { reservationSummary } from '../components/reservationLabels';
import type { ReservationsStackParamList } from '../navigation/ReservationsNavigator';
import { useActiveReservations } from '../viewmodels/useActiveReservations';

export function ReservationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ReservationsStackParamList>>();
  const { params } = useRoute<RouteProp<ReservationsStackParamList, 'ReservationsList'>>();
  const { reservations, isLoading, isRefreshing, errorMessage, hasData, refresh } = useActiveReservations();

  const newButton = (
    <Pressable
      style={styles.newButton}
      onPress={() => navigation.navigate('NewReservation')}
      accessibilityRole="button"
    >
      <Text style={styles.newButtonText}>Nueva reservación</Text>
    </Pressable>
  );

  if (isLoading) return <ScreenState kind="loading" message="Cargando reservaciones…" />;

  return (
    <View style={styles.container}>
      {newButton}
      {params?.notice && (
        <Card style={styles.notice}>
          <Text accessibilityRole="alert">{params.notice}</Text>
        </Card>
      )}
      {errorMessage && !hasData ? (
        <ScreenState kind="error" message={errorMessage} onRetry={refresh} />
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(reservation) => reservation.id}
          renderItem={({ item }) => (
            <ListItem
              title={item.customerName}
              subtitle={reservationSummary(item)}
              trailing={formatDateTime(item.dateTime)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={<ScreenState kind="empty" message="No hay reservaciones activas." />}
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  newButton: {
    margin: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  newButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  notice: { marginHorizontal: spacing.md, marginBottom: spacing.md },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: 84 },
});
