import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, opacity, pressScale, radius, shadows, sizes, spacing, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  /** primary: naranja de marca · secondary: pizarra · outline: borde · ghost: solo texto. */
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Muestra un indicador en lugar del texto y bloquea el botón. */
  loading?: boolean;
  /** Si no se da, el lector de pantalla lee `label`. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const SPINNER_COLOR: Record<ButtonVariant, string> = {
  primary: colors.textOnBrand,
  secondary: colors.textOnBrand,
  outline: colors.brandStrong,
  ghost: colors.brandStrong,
};

/** Botón de la app, con los estilos `btn-primary` y `btn-secondary` de la web. */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityLabel,
  style,
  testID,
}: Props) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && pressedStyles[variant],
        pressed && pressScale,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={SPINNER_COLOR[variant]} />
      ) : (
        <Text style={[styles.label, labelStyles[variant]]} numberOfLines={1}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.control,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.brand, ...shadows.brand },
  secondary: { backgroundColor: colors.secondary, ...shadows.card },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  ghost: { minHeight: sizes.touchTarget, paddingHorizontal: spacing.md },
  disabled: { opacity: opacity.disabled, boxShadow: 'none' },
  label: typography.button,
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.brandStrong },
  secondary: { opacity: opacity.pressed },
  outline: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  ghost: { backgroundColor: colors.brandSoft },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.textOnBrand },
  secondary: { color: colors.textOnBrand },
  outline: { color: colors.text, ...typography.bodyStrong },
  ghost: { color: colors.brandStrong, ...typography.bodyStrong },
});
