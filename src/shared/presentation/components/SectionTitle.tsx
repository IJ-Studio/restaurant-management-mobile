import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../theme';

interface Props {
  title: string;
  /** Algo a la derecha del título: un contador, una leyenda… */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Título de una sección dentro de una pantalla (más chico que ScreenHeader). */
export function SectionTitle({ title, right, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: { ...typography.heading, color: colors.text },
});
