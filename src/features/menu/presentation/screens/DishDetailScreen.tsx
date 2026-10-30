import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ComponentProps } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../../shared/presentation/components/Card';
import { ScreenState } from '../../../../shared/presentation/components/ScreenState';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { colors, radius, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { AddToOrderButton } from '../../../orders/presentation/components/AddToOrderButton';
import type { DishTag } from '../../domain/entities/Dish';
import { TAG_LABEL } from '../components/dishLabels';
import type { MenuStackParamList } from '../navigation/MenuNavigator';
import { useDish } from '../viewmodels/useDish';

type Props = NativeStackScreenProps<MenuStackParamList, 'DishDetail'>;

/** Etiquetas que destacan el platillo van en naranja; las de dieta, en neutro. */
const HIGHLIGHT_TAGS: readonly DishTag[] = ['popular', 'nuevo', 'del-chef'];

function Meta({ icon, text }: { icon: ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={styles.metaRow}>
      <Ionicons name={icon} size={18} color={colors.brandStrong} />
      <Text style={styles.meta}>{text}</Text>
    </View>
  );
}

export function DishDetailScreen({ route }: Props) {
  const { dish, isLoading, errorMessage, retry } = useDish(route.params.dishId);

  if (!dish && isLoading) return <ScreenState kind="loading" />;
  if (!dish)
    return <ScreenState kind="error" message={errorMessage ?? 'Platillo no encontrado.'} onRetry={retry} />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {dish.imageUrl ? (
        <Image source={{ uri: dish.imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons name="restaurant-outline" size={48} color={colors.brand} />
        </View>
      )}
      <Card elevation="raised" style={styles.card}>
        <View style={styles.titleRow}>
          <Text style={styles.name} accessibilityRole="header">
            {dish.name}
          </Text>
          <Text style={styles.price}>{formatCurrency(dish.price)}</Text>
        </View>
        <StatusBadge
          label={dish.available ? 'Disponible' : 'Agotado'}
          tone={dish.available ? 'success' : 'danger'}
          style={styles.availability}
        />
        {dish.description ? <Text style={styles.description}>{dish.description}</Text> : null}
        {dish.prepTimeMinutes || dish.spicyLevel ? (
          <View style={styles.metas}>
            {dish.prepTimeMinutes ? (
              <Meta icon="time-outline" text={`Tiempo de preparación: ${dish.prepTimeMinutes} min`} />
            ) : null}
            {dish.spicyLevel ? (
              <Meta icon="flame-outline" text={`Nivel de picante: ${dish.spicyLevel}/5`} />
            ) : null}
          </View>
        ) : null}
        {dish.tags.length > 0 && (
          <View style={styles.tags}>
            {dish.tags.map((tag) => (
              <StatusBadge
                key={tag}
                label={TAG_LABEL[tag]}
                tone={HIGHLIGHT_TAGS.includes(tag) ? 'brand' : 'neutral'}
              />
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  image: { width: '100%', aspectRatio: 16 / 10, borderRadius: radius.xl },
  imagePlaceholder: { backgroundColor: colors.brandSoft, alignItems: 'center', justifyContent: 'center' },
  // La tarjeta se monta un poco sobre la foto, como las tarjetas del menú en la web.
  card: { marginTop: -spacing.xxl, marginHorizontal: spacing.sm, padding: spacing.xl },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  name: { flex: 1, ...typography.title, color: colors.text },
  price: { ...typography.title, color: colors.brandStrong },
  availability: { marginTop: spacing.sm },
  description: { ...typography.body, color: colors.text, marginTop: spacing.lg },
  metas: { marginTop: spacing.lg, gap: spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  meta: { ...typography.small, color: colors.textSecondary },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
});
