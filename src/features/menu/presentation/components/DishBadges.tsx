import { StyleSheet, View } from 'react-native';

import { Badge } from '../../../../shared/presentation/components/Badge';
import type { Dish } from '../../domain/entities/Dish';

export function dishBadgeLabels(dish: Dish): string[] {
  const { tags } = dish;
  return [
    tags.chefSpecial && 'Del chef',
    tags.popular && 'Popular',
    tags.isNew && 'Nuevo',
    tags.vegan ? 'Vegano' : tags.vegetarian && 'Vegetariano',
    tags.glutenFree && 'Sin gluten',
    tags.spicy && (tags.spicyLevel > 0 ? `Picante ${'🌶'.repeat(Math.min(tags.spicyLevel, 5))}` : 'Picante'),
  ].filter((label): label is string => typeof label === 'string');
}

export function DishBadges({ dish }: { dish: Dish }) {
  const labels = dishBadgeLabels(dish);
  if (dish.available && labels.length === 0) return null;
  return (
    <View style={styles.row}>
      {!dish.available ? <Badge label="Agotado" tone="danger" /> : null}
      {labels.map((label) => (
        <Badge key={label} label={label} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
});
