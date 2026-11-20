import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '../theme';
import { DoubleRule } from './DoubleRule';

interface Props {
  title?: string;
  /** Etiqueta en versalitas ocre sobre el título (fecha, mesa…). */
  eyebrow?: string;
  subtitle?: string;
  /** Contenido extra de la tarjeta (un monto grande, el sello…). */
  children?: ReactNode;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}

/**
 * Banda destacada de una pantalla (Resumen del día, cobro, caja, perfil): superficie café sólida con
 * filete de control, radio 4 y filete doble ocre arriba. Sin degradados, sombras ni marcas de agua.
 */
export function HeroCard({ title, eyebrow, subtitle, children, align = 'left', style }: Props) {
  const textAlign = { textAlign: align } as const;
  return (
    <View style={[styles.card, align === 'center' && styles.centered, style]}>
      <DoubleRule style={styles.rule} />
      {eyebrow && <Text style={[styles.eyebrow, textAlign]}>{eyebrow}</Text>}
      {title && (
        <Text style={[styles.title, textAlign]} accessibilityRole="header">
          {title}
        </Text>
      )}
      {subtitle && <Text style={[styles.subtitle, textAlign]}>{subtitle}</Text>}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  centered: { alignItems: 'center' },
  rule: { marginBottom: spacing.md },
  eyebrow: { ...typography.overline, color: colors.brandStrong },
  title: { ...typography.title, color: colors.text, marginTop: spacing.xs },
  subtitle: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xs },
});
