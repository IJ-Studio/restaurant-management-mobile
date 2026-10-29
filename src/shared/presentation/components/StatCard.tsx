import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing, typography } from '../theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  value: string;
  icon: IconName;
  /** Texto chico bajo el valor (p. ej. "de 16 mesas"). */
  hint?: string;
  /** `brand` resalta la tarjeta principal (ventas), como `promo-card` de la web. */
  tone?: 'brand' | 'neutral';
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta de un total del día: ícono, valor grande y etiqueta. */
export function StatCard({ label, value, icon, hint, tone = 'neutral', style }: Props) {
  const brand = tone === 'brand';
  return (
    <View
      style={[styles.card, brand && styles.brandCard, style]}
      accessible
      accessibilityLabel={[label, value, hint].filter(Boolean).join(', ')}
    >
      <View style={[styles.icon, brand && styles.brandIcon]}>
        <Ionicons name={icon} size={18} color={brand ? colors.textOnBrand : colors.brandStrong} />
      </View>
      <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
  brandCard: { backgroundColor: colors.brandSoft, borderColor: colors.brandSoft },
  icon: {
    width: spacing.xxl,
    height: spacing.xxl,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  brandIcon: { backgroundColor: colors.brand },
  value: { ...typography.title, color: colors.text },
  label: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  hint: { ...typography.caption, color: colors.textSecondary },
});
