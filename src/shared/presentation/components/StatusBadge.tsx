import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';

export type StatusTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info';

interface Props {
  label: string;
  tone?: StatusTone;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<StatusTone, { backgroundColor: string; color: string }> = {
  neutral: { backgroundColor: colors.brandSoft, color: colors.textSecondary },
  brand: { backgroundColor: colors.brandTint, color: colors.brandStrong },
  success: { backgroundColor: colors.successSoft, color: colors.success },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  info: { backgroundColor: colors.infoSoft, color: colors.info },
};

/**
 * Insignia de estado (Agotado, Confirmada…): pastilla con filete y punto del color del estado, fondo
 * al 12 % y texto en versalitas. Es el único elemento con radio 999 junto con las mesas redondas.
 */
export function StatusBadge({ label, tone = 'neutral', style }: Props) {
  const { backgroundColor, color } = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor, borderColor: color }, style]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const DOT = 6;

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + spacing.xxs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + spacing.xxs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  dot: { width: DOT, height: DOT, borderRadius: radius.pill },
  text: typography.badge,
});
