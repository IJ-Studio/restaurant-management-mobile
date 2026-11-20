import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, pressOffset, radius, sizes, spacing, typography } from '../theme';

interface Props {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Acceso rápido (cabeceras y módulos del Dashboard): caja de control con radio 2, filete de control,
 * 44 de alto y chevron que indica que lleva a otra pantalla.
 */
export function HeaderButton({ label, icon, onPress, accessibilityLabel, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, pressed && pressOffset, style]}
    >
      {icon && <Ionicons name={icon} size={16} color={colors.brand} />}
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + spacing.xxs,
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.brandSoft, borderColor: colors.brand },
  label: { ...typography.caption, color: colors.text, flexShrink: 1 },
  // Margen automático y no flexGrow en la etiqueta: con flexGrow, Yoga mide cada acceso a todo lo ancho
  // dentro de una fila con flexWrap y el contenedor reserva una línea por acceso (hueco en el Dashboard).
  chevron: { marginLeft: 'auto' },
});
