import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../../shared/presentation/components/Card';
import { QueryState } from '../../../../shared/presentation/components/QueryState';
import { formatPrice } from '../../../../shared/presentation/format';
import { DishBadges } from '../components/DishBadges';
import type { MenuStackParamList } from '../navigation/MenuStack';
import { useDish } from '../viewmodels/useDish';

type Props = NativeStackScreenProps<MenuStackParamList, 'DishDetail'>;

export function DishDetailScreen({ route }: Props) {
  const { dish, isLoading, error, refresh } = useDish(route.params.id);

  if (!dish) {
    return <QueryState isLoading={isLoading} error={error} onRetry={refresh} loadingLabel="Cargando platillo" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {dish.imageUrl ? (
        <Image
          source={{ uri: dish.imageUrl }}
          style={styles.image}
          accessibilityLabel={`Foto de ${dish.name}`}
          accessibilityIgnoresInvertColors
        />
      ) : null}
      <Card style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.name} accessibilityRole="header">
            {dish.name}
          </Text>
          <Text style={styles.price}>{formatPrice(dish.price)}</Text>
        </View>
        <Text style={[styles.status, !dish.available && styles.soldOut]}>
          {dish.available ? 'Disponible' : 'Agotado'}
        </Text>
        <DishBadges dish={dish} />
        {dish.description ? <Text style={styles.description}>{dish.description}</Text> : null}
        {dish.prepTimeMinutes ? (
          <Text style={styles.meta}>Tiempo de preparación: {dish.prepTimeMinutes} min</Text>
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  image: { width: '100%', aspectRatio: 4 / 3, borderRadius: 12, backgroundColor: '#eee' },
  card: { gap: 8 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  name: { flex: 1, fontSize: 22, fontWeight: '700', color: '#111' },
  price: { fontSize: 20, fontWeight: '700', color: '#111' },
  status: { fontSize: 14, fontWeight: '600', color: '#1e7e34' },
  soldOut: { color: '#b00020' },
  description: { fontSize: 15, color: '#333', lineHeight: 21 },
  meta: { fontSize: 13, color: '#777' },
});
