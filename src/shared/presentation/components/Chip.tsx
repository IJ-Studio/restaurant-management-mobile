import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, pressOffset, radius, sizes, spacing, typography } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Número opcional junto al texto (p. ej. cuántos pedidos hay en ese filtro). */
  count?: number;
  /** `radio` para elegir una opción de un grupo (mesa, canal, filtro). */
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  /** `tab`: pestaña de una barra (texto y filete doble ocre bajo la activa), en lugar de caja. */
  variant?: 'chip' | 'tab';
  style?: StyleProp<ViewStyle>;
}

/** Opción seleccionable: caja de control con radio 2; seleccionada cambia relleno y filete al acento. */
export function Chip({
  label,
  selected,
  onPress,
  count,
  accessibilityRole = 'radio',
  accessibilityLabel,
  variant = 'chip',
  style,
}: Props) {
  const text = count === undefined ? label : `${label} · ${count}`;
  if (variant === 'tab') {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole={accessibilityRole}
        accessibilityState={{ selected }}
        accessibilityLabel={accessibilityLabel ?? text}
        style={({ pressed }) => [styles.tab, pressed && styles.tabPressed, style]}
      >
        <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{text}</Text>
        <View style={[styles.rule, selected && styles.ruleSelected]} />
      </Pressable>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? text}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
        pressed && pressOffset,
        style,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: sizes.touchTarget,
    minWidth: sizes.touchTarget,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.brandTint, borderColor: colors.brand },
  pressed: { backgroundColor: colors.brandSoft },
  label: { ...typography.bodyStrong, color: colors.text },
  labelSelected: { color: colors.brandStrong },
  tab: { minHeight: sizes.touchTarget, justifyContent: 'flex-end', paddingHorizontal: spacing.xs },
  tabPressed: { backgroundColor: colors.brandSoft },
  tabLabel: { ...typography.bodyStrong, color: colors.textSecondary, paddingBottom: spacing.sm },
  tabLabelSelected: { color: colors.text },
  // Filete doble ocre (1 + 3 + 1 px) bajo la pestaña activa; la inactiva reserva el alto para no saltar.
  rule: { height: 5 },
  ruleSelected: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.brand },
});
