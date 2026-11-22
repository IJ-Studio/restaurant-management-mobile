import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../theme';
import { DoubleRule } from './DoubleRule';

interface Props {
  title: string;
  /** Etiqueta de sección en versalitas ocre sobre el filete doble. */
  eyebrow?: string;
  subtitle?: string;
  /** `display` para la portada (Login); `title` para encabezados dentro de una pantalla. */
  size?: 'display' | 'title';
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}

/** Etiqueta de sección de DESIGN.md: etiqueta en versalitas, filete doble, título en Fraunces y subtítulo. */
export function ScreenHeader({ title, eyebrow, subtitle, size = 'title', align = 'left', style }: Props) {
  const textAlign = { textAlign: align } as const;

  return (
    <View style={style}>
      {eyebrow && <Text style={[styles.eyebrow, textAlign]}>{eyebrow}</Text>}
      <DoubleRule style={[styles.rule, align === 'center' && styles.ruleCentered]} />
      <Text style={[typography[size], styles.title, textAlign]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle && <Text style={[styles.subtitle, textAlign]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { ...typography.overline, color: colors.brand, marginBottom: spacing.sm },
  rule: { marginBottom: spacing.md + spacing.xxs },
  ruleCentered: { alignSelf: 'center' },
  title: { color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
