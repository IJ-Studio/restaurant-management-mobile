import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '../theme';

interface Props {
  children: ReactNode;
  /** `raised` marca lo que destaca sobre la lista con el filete de control; no hay sombras. */
  elevation?: 'card' | 'raised';
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta de DESIGN.md: superficie, filete de 1 px y radio 4. La jerarquía va por color, no por sombra. */
export function Card({ children, elevation = 'card', style }: Props) {
  return <View style={[styles.card, elevation === 'raised' && styles.raised, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  raised: { borderColor: colors.borderStrong },
});
