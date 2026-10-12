import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** Contenedor con fondo, borde y esquinas redondeadas. Base de listas y detalles. */
export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d0d7de',
    padding: 12,
  },
});
