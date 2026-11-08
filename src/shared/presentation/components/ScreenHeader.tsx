import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, spacing, typography } from '../theme';

interface Props {
  title: string;
  /** Texto chico en naranja y mayúsculas sobre el título (como la categoría en la web). */
  eyebrow?: string;
  subtitle?: string;
  /** `display` para la portada (Login); `title` para encabezados dentro de una pantalla. */
  size?: 'display' | 'title';
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}

/** Encabezado de pantalla o sección: antetítulo naranja, título grueso y subtítulo. */
export function ScreenHeader({ title, eyebrow, subtitle, size = 'title', align = 'left', style }: Props) {
  const textAlign = { textAlign: align } as const;

  return (
    <View style={style}>
      {eyebrow && <Text style={[styles.eyebrow, textAlign]}>{eyebrow}</Text>}
      <Text style={[typography[size], styles.title, textAlign]} accessibilityRole="header">
        {title}
      </Text>
      {subtitle && <Text style={[styles.subtitle, textAlign]}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: { ...typography.overline, color: colors.brandStrong, marginBottom: spacing.sm },
  title: { color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
});
