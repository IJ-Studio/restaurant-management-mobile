import Ionicons from '@expo/vector-icons/Ionicons';
import { memo, useRef, useState, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputInstance,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { colors, radius, sizes, spacing, typography } from '../theme';

interface Props extends Omit<TextInputProps, 'style'> {
  /** Etiqueta visible encima del campo; también es el nombre para el lector de pantalla si no se da otro. */
  label: string;
  error?: string;
  /** Elemento a la derecha dentro del campo (p. ej. un botón para mostrar la contraseña). */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Campo de texto de DESIGN.md: etiqueta siempre encima, caja de 44 con radio 2 y filete de control.
 * Al enfocarse se pinta el anillo de foco; con error, el borde y el mensaje (con ícono) van en rojo.
 */
// memo: solo se vuelve a pintar si cambian sus props.
export const TextField = memo(function TextField({
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
  const input = useRef<TextInputInstance>(null);

  return (
    <View style={style}>
      {/* El TextInput ya lleva la etiqueta; la visible se oculta al lector para no leerla dos veces.
          Tocarla enfoca el campo, como un <label for> de la web. */}
      <Text
        onPress={() => input.current?.focus()}
        suppressHighlighting
        style={[styles.label, !!error && styles.labelInvalid]}
        importantForAccessibility="no"
        accessibilityElementsHidden
      >
        {label}
      </Text>
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
          ref={input}
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
      {error && (
        <View style={styles.errorRow}>
          <Ionicons
            name="alert-circle-outline"
            size={16}
            color={colors.danger}
            importantForAccessibility="no"
          />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  label: { ...typography.label, color: colors.text, marginBottom: spacing.xs + spacing.xxs },
  labelInvalid: { color: colors.danger },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizes.control,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  // El anillo de foco no ocupa espacio: no mueve el formulario al enfocar.
  focused: { borderColor: colors.brand, outlineWidth: 2, outlineColor: colors.brandStrong, outlineOffset: 2 },
  invalid: { borderColor: colors.danger },
  readOnly: { backgroundColor: colors.brandSoft },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    paddingHorizontal: spacing.md + spacing.xxs,
    paddingVertical: spacing.sm + spacing.xxs,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  errorRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.xs },
  error: { ...typography.caption, color: colors.danger, flexShrink: 1 },
});
