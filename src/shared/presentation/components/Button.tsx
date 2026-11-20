import { memo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, opacity, pressOffset, radius, sizes, spacing, typography } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  /** primary: relleno de acento · secondary: tonal café · outline: filete de control · ghost: enlace. */
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
  secondary: colors.text,
  outline: colors.text,
  ghost: colors.brandStrong,
};

/** Botón de la app (`btn-primario` y `btn-secundario` de DESIGN.md): 44 de alto, radio 2, etiqueta en versalitas. */
// memo: solo se vuelve a pintar si cambian sus props.
export const Button = memo(function Button({
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
        pressed && pressOffset,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={SPINNER_COLOR[variant]} />
      ) : (
        // Hasta 2 líneas: una etiqueta larga en versalitas se parte en lugar de cortarse con «…».
        <Text style={[styles.label, labelStyles[variant]]} numberOfLines={2}>
          {label}
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.control,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.brand, borderColor: colors.brand },
  secondary: { backgroundColor: colors.brandSoft, borderColor: colors.borderStrong },
  outline: { backgroundColor: 'transparent', borderColor: colors.borderStrong },
  ghost: { minHeight: sizes.touchTarget, paddingHorizontal: spacing.md },
  disabled: { opacity: opacity.disabled },
  label: { ...typography.button, textAlign: 'center' },
});

const pressedStyles = StyleSheet.create({
  primary: { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong },
  secondary: { borderColor: colors.brand },
  outline: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  ghost: { backgroundColor: colors.brandTint },
});

const labelStyles = StyleSheet.create({
  primary: { color: colors.textOnBrand },
  secondary: { color: colors.text },
  outline: { color: colors.text },
  // ghost es un enlace: tipo de oración, sin versalitas, para no competir con los botones.
  ghost: { ...typography.bodyStrong, color: colors.brandStrong, textTransform: 'none', letterSpacing: 0 },
});
