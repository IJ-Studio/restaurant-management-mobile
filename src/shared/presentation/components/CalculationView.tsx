import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Calculation } from '../../domain/Calculation';
import { colors, opacity, radius, sizes, spacing, typography } from '../theme';

/** Botón «Ver cálculo» y, al abrirlo, la fórmula, el periodo, los filtros y cada dato con su valor. */
export function CalculationToggle({
  title,
  result,
  calculation,
}: {
  title: string;
  result: string;
  calculation: Calculation;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Ocultar' : 'Ver'} cálculo de ${title}`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.toggle, pressed && styles.togglePressed]}
      >
        <Text style={styles.toggleText}>{open ? 'Ocultar cálculo' : 'Ver cálculo'}</Text>
      </Pressable>
      {open && (
        <View style={styles.box} accessibilityLabel={`Cálculo de ${title}`}>
          <Text style={styles.muted}>{calculation.formula}</Text>
          {calculation.period && (
            <Text
              style={styles.muted}
            >{`Periodo: ${calculation.period.start} a ${calculation.period.end}`}</Text>
          )}
          {calculation.filters && Object.keys(calculation.filters).length > 0 && (
            <Text style={styles.muted}>{`Filtros: ${Object.entries(calculation.filters)
              .map(([k, v]) => `${k} = ${String(v)}`)
              .join(' · ')}`}</Text>
          )}
          {calculation.data.length === 0 && <Text style={styles.muted}>Sin datos en este periodo.</Text>}
          {calculation.data.map((d, i) => (
            <View key={`${i}-${d.key}`} style={styles.row}>
              <Text style={styles.key}>{d.key}</Text>
              <Text style={styles.value}>{String(d.value)}</Text>
            </View>
          ))}
          <View style={[styles.row, styles.total]}>
            <Text style={styles.key}>Resultado</Text>
            <Text style={[styles.value, styles.bold]}>{result}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Enlace en acento subrayado con área táctil completa de 44 (antes 32 con hitSlop).
  toggle: { alignSelf: 'flex-start', minHeight: sizes.touchTarget, justifyContent: 'center' },
  togglePressed: { opacity: opacity.pressed },
  toggleText: { ...typography.caption, color: colors.brandStrong, textDecorationLine: 'underline' },
  box: {
    gap: spacing.xxs,
    marginTop: spacing.xxs,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  muted: { ...typography.caption, color: colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  total: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.xxs },
  key: { ...typography.caption, color: colors.text, flexShrink: 1 },
  value: { ...typography.caption, color: colors.text },
  bold: { fontFamily: typography.bodyStrong.fontFamily },
});
