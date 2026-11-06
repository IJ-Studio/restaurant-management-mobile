import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../theme';

interface Props {
  children: ReactNode;
  /** `raised` usa la sombra más marcada (T.shadowHov de la web) para lo que flota sobre la lista. */
  elevation?: 'card' | 'raised';
  style?: StyleProp<ViewStyle>;
}

/** Tarjeta blanca con borde cálido y sombra suave, como `menu-card` de la web. */
export function Card({ children, elevation = 'card', style }: Props) {
  return <View style={[styles.card, shadows[elevation], style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
