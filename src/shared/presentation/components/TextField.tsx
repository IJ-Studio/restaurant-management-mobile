import { useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, sizes, spacing, typography } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  /** Etiqueta visible sobre el borde; también es el nombre para el lector de pantalla si no se da otro. */
  label: string;
  error?: string;
  /** Elemento a la derecha dentro del campo (p. ej. un botón para mostrar la contraseña). */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Campo de texto con la etiqueta montada sobre el borde, como `input-floating` de la web.
 * Al enfocarse se pinta el anillo naranja; con error, el borde y el mensaje van en rojo.
 */
export function TextField({
  label,
  error,
  right,
  style,
  multiline,
  onFocus,
  onBlur,
  accessibilityLabel,
  editable = true,
  ...inputProps
}: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.field,
          focused && styles.focused,
          !!error && styles.invalid,
          !editable && styles.readOnly,
        ]}
      >
        <TextInput
          {...inputProps}
          editable={editable}
          multiline={multiline}
          accessibilityLabel={accessibilityLabel ?? label}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.brand}
          style={[styles.input, multiline && styles.multiline]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
        {right}
      </View>
      {/* El TextInput ya lleva la etiqueta; la visible se oculta al lector para no leerla dos veces. */}
      <Text
        style={[styles.label, focused && styles.labelFocused, !!error && styles.labelInvalid]}
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        {label}
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const LABEL_OFFSET = spacing.sm + spacing.xxs;

const styles = StyleSheet.create({
  // El margen superior deja lugar a la mitad de la etiqueta que sobresale del borde.
  container: { paddingTop: LABEL_OFFSET },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.control,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  focused: { borderColor: colors.brand, boxShadow: `0 0 0 3px ${colors.focusRing}` },
  invalid: { borderColor: colors.danger },
  readOnly: { backgroundColor: colors.elevated },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  label: {
    position: 'absolute',
    top: 0,
    left: spacing.md,
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    ...typography.caption,
    color: colors.textSecondary,
  },
  labelFocused: { color: colors.brandStrong },
  labelInvalid: { color: colors.danger },
  error: { ...typography.caption, color: colors.danger, marginTop: spacing.xs, marginLeft: spacing.xs },
});
