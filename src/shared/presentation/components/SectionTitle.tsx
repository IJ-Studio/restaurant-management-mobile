import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { DoubleRule } from './DoubleRule';

interface Props {
  title: string;
  /** Algo a la derecha del título: un contador, una leyenda… */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Título de una sección dentro de una pantalla: filete doble y título en Fraunces (más chico que ScreenHeader). */
export function SectionTitle({ title, right, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <DoubleRule style={styles.rule} />
      <View style={styles.row}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.md },
  rule: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  title: { ...typography.heading, color: colors.text, flexShrink: 1 },
});
