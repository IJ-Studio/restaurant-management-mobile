import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '../theme';

/** Filete doble ocre de la etiqueta de la casa (48 × 5: 1 + 3 + 1 px). Decorativo: el lector lo ignora. */
export function DoubleRule({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[styles.rule, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

const styles = StyleSheet.create({
  rule: { width: 48, height: 5, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.brand },
});
