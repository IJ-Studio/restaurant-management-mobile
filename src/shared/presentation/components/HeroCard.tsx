import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, gradients, radius, shadows, spacing, typography } from '../theme';

interface Props {
  title?: string;
  /** Texto chico en mayúsculas sobre el título (fecha, mesa…). */
  eyebrow?: string;
  subtitle?: string;
  /** Contenido extra dentro del degradado (un monto grande, un avatar…). */
  children?: ReactNode;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}

/**
 * Tarjeta con el degradado de marca para lo más importante de una pantalla, como los bloques
 * naranjas de la web. Todo el texto va en blanco: pasa AA en todo el degradado.
 */
export function HeroCard({ title, eyebrow, subtitle, children, align = 'left', style }: Props) {
  const textAlign = { textAlign: align } as const;
  return (
    <LinearGradient
      colors={gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, align === 'center' && styles.centered, style]}
    >
      {/* Círculo decorativo de fondo, como el plato dibujado del Hero de la web. */}
      <View style={styles.ring} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      {eyebrow && <Text style={[styles.eyebrow, textAlign]}>{eyebrow}</Text>}
      {title && (
        <Text style={[styles.title, textAlign]} accessibilityRole="header">
          {title}
        </Text>
      )}
      {subtitle && <Text style={[styles.subtitle, textAlign]}>{subtitle}</Text>}
      {children}
    </LinearGradient>
  );
}

const RING = 220;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    ...shadows.brand,
  },
  centered: { alignItems: 'center' },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: spacing.xxl,
    borderColor: colors.onBrandDecor,
    right: -RING / 3,
    top: -RING / 3,
  },
  eyebrow: { ...typography.overline, color: colors.textOnBrandMuted },
  title: { ...typography.display, color: colors.textOnBrand, marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.textOnBrandMuted, marginTop: spacing.xs },
});
