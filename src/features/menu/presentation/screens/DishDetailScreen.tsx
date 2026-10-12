import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../../shared/presentation/components/Card';
import { AddToOrderButton } from '../../../orders/presentation/components/AddToOrderButton';
import { ScreenState } from '../../../../shared/presentation/components/ScreenState';
import { colors, spacing } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { TAG_LABEL } from '../components/dishLabels';
import type { MenuStackParamList } from '../navigation/MenuNavigator';
import { useDish } from '../viewmodels/useDish';

type Props = NativeStackScreenProps<MenuStackParamList, 'DishDetail'>;

export function DishDetailScreen({ route }: Props) {
  const { dish, isLoading, errorMessage, retry } = useDish(route.params.dishId);

  if (!dish && isLoading) return <ScreenState kind="loading" />;
  if (!dish)
    return <ScreenState kind="error" message={errorMessage ?? 'Platillo no encontrado.'} onRetry={retry} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {dish.imageUrl && (
        <Image source={{ uri: dish.imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />
      )}
      <Card>
        <View style={styles.titleRow}>
          <Text style={styles.name} accessibilityRole="header">
            {dish.name}
          </Text>
          <Text style={styles.price}>{formatCurrency(dish.price)}</Text>
        </View>
        <Text style={[styles.availability, !dish.available && styles.soldOut]}>
          {dish.available ? 'Disponible' : 'Agotado'}
        </Text>
        {dish.description ? <Text style={styles.description}>{dish.description}</Text> : null}
        {dish.prepTimeMinutes ? (
          <Text style={styles.meta}>Tiempo de preparación: {dish.prepTimeMinutes} min</Text>
        ) : null}
        {dish.spicyLevel ? <Text style={styles.meta}>Nivel de picante: {dish.spicyLevel}/5</Text> : null}
        {dish.tags.length > 0 && (
          <View style={styles.tags}>
            {dish.tags.map((tag) => (
              <Text key={tag} style={styles.tag}>
                {TAG_LABEL[tag]}
              </Text>
            ))}
          </View>
        )}
      </Card>
      <AddToOrderButton
        dish={{ dishId: dish.id, name: dish.name, unitPrice: dish.price }}
        disabled={!dish.available}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  image: { width: '100%', aspectRatio: 16 / 10, borderRadius: 12, marginBottom: spacing.lg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.text, marginRight: spacing.md },
  price: { fontSize: 20, fontWeight: '700', color: colors.primary },
  availability: { marginTop: spacing.xs, fontWeight: '600', color: colors.success },
  soldOut: { color: colors.danger },
  description: { marginTop: spacing.md, fontSize: 15, lineHeight: 21, color: colors.text },
  meta: { marginTop: spacing.sm, fontSize: 14, color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.md },
  tag: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 12,
    overflow: 'hidden',
  },
});
