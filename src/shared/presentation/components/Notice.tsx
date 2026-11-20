import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fonts, radius, spacing, typography } from '../theme';

type Tone = 'success' | 'warning' | 'danger' | 'info';

interface Props {
  message: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
}

const TONES: Record<Tone, { backgroundColor: string; color: string; borderColor: string }> = {
  success: { backgroundColor: colors.successSoft, color: colors.success, borderColor: colors.success },
  warning: { backgroundColor: colors.warningSoft, color: colors.warning, borderColor: colors.warning },
  danger: { backgroundColor: colors.dangerSoft, color: colors.danger, borderColor: colors.danger },
  info: { backgroundColor: colors.infoSoft, color: colors.info, borderColor: colors.info },
};

/** Aviso en línea: fondo al 12 % y filete del color del estado (cambia relleno y filete, no solo el tinte). */
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
    borderWidth: 1,
    overflow: 'hidden',
  },
});
