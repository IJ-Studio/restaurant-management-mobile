import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, pressScale, radius, sizes, spacing, typography } from '../theme';

interface Props {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Botón compacto para el encabezado de navegación (ícono + texto en una pastilla). */
export function HeaderButton({ label, icon, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      hitSlop={spacing.sm}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, pressed && pressScale]}
    >
      <Ionicons name={icon} size={16} color={colors.brandStrong} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: sizes.touchTarget - spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
  },
  pressed: { backgroundColor: colors.border },
  label: { ...typography.caption, color: colors.brandStrong },
});
