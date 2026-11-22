import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { Calculation } from '../../domain/Calculation';
import { colors, radius, spacing, typography } from '../theme';
import { CalculationToggle } from './CalculationView';

type IconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  value: string;
  icon: IconName;
  /** Texto chico bajo el valor (p. ej. "de 16 mesas"). */
  hint?: string;
  /** `brand` resalta la tarjeta principal (ventas) con la superficie café. */
  tone?: 'brand' | 'neutral';
  style?: StyleProp<ViewStyle>;
  /** «Ver cálculo» (P1.4): el desglose de la cifra. */
  calculation?: Calculation;
}

/** Indicador de DESIGN.md: rótulo en versalitas con su ícono a la derecha, cifra en Fraunces y pista. */
export function StatCard({ label, value, icon, hint, tone = 'neutral', style, calculation }: Props) {
  const brand = tone === 'brand';
  return (
    <View style={[styles.card, brand && styles.brandCard, style]}>
      <View accessible accessibilityLabel={[label, value, hint].filter(Boolean).join(', ')}>
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Ionicons name={icon} size={16} color={colors.brand} />
        </View>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
      {calculation && (
        <CalculationToggle title={label.toLowerCase()} result={value} calculation={calculation} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  brandCard: { backgroundColor: colors.brandSoft, borderColor: colors.borderStrong },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  label: { ...typography.overline, color: colors.textSecondary, flexShrink: 1 },
  value: { ...typography.stat, color: colors.text },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
});
