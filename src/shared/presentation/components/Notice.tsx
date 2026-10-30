import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '../theme';

type Tone = 'success' | 'warning' | 'danger' | 'info';

interface Props {
  message: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<Tone, { backgroundColor: string; color: string }> = {
  success: { backgroundColor: colors.successSoft, color: colors.success },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger },
  info: { backgroundColor: colors.infoSoft, color: colors.info },
};

/** Aviso en línea (`alert-error`, `alert-success`… de la web). El lector de pantalla lo anuncia. */
export function Notice({ message, tone = 'danger', style }: Props) {
  return (
    <Text style={[styles.notice, TONES[tone], style]} accessibilityRole="alert">
      {message}
    </Text>
  );
}

const styles = StyleSheet.create({
  notice: {
    ...typography.small,
    fontFamily: fonts.semibold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - spacing.xxs,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
