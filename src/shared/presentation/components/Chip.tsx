import {
  Pressable,
  StyleSheet,
  Text,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, pressScale, radius, sizes, spacing, typography } from '../theme';

interface Props {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Número opcional junto al texto (p. ej. cuántos pedidos hay en ese filtro). */
  count?: number;
  /** `radio` para elegir una opción de un grupo (mesa, canal, filtro). */
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/** Opción seleccionable en forma de pastilla; seleccionada se pinta con el naranja de marca. */
export function Chip({
  label,
  selected,
  onPress,
  count,
  accessibilityRole = 'radio',
  accessibilityLabel,
  style,
}: Props) {
  const text = count === undefined ? label : `${label} · ${count}`;
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
        pressed && pressScale,
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
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.secondary, borderColor: colors.secondary },
  pressed: { backgroundColor: colors.elevated },
  label: { ...typography.bodyStrong, color: colors.text },
  labelSelected: { color: colors.textOnBrand },
});
