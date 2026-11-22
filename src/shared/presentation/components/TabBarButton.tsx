import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { colors } from '../theme';

/**
 * Botón de la barra de pestañas: la activa lleva un filete superior de 2 px en acento (sin círculo
 * relleno detrás del ícono). Pasa intactas las props de accesibilidad que arma React Navigation.
 */
export function TabBarButton({
  children,
  style,
  onPress,
  href,
  pressColor,
  pressOpacity,
  hoverEffect,
  ...rest
}: BottomTabBarButtonProps) {
  const selected = rest['aria-selected'] === true;
  return (
    <Pressable
      {...rest}
      onPress={onPress as PressableProps['onPress']}
      style={({ pressed }) => [style, styles.tab, selected && styles.selected, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // El borde transparente reserva los 2 px para que la pestaña no salte al activarse.
  tab: { borderTopWidth: 2, borderTopColor: 'transparent' },
  selected: { borderTopColor: colors.brand },
  pressed: { backgroundColor: colors.brandSoft },
});
