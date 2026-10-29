import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export type StatusTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  label: string;
  tone?: StatusTone;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<StatusTone, { backgroundColor: string; color: string }> = {
  neutral: { backgroundColor: colors.elevated, color: colors.textSecondary },
  brand: { backgroundColor: colors.brandSoft, color: colors.brandStrong },
  success: { backgroundColor: colors.successSoft, color: colors.success },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  info: { backgroundColor: colors.infoSoft, color: colors.info },
};

/** Pastilla de estado (Agotado, Confirmada, Por confirmar…), como `promo-badge` de la web. */
export function StatusBadge({ label, tone = 'neutral', style }: Props) {
  return <Text style={[styles.badge, TONES[tone], style]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    ...typography.badge,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md - spacing.xxs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
});
