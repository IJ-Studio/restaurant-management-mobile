import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Calculation } from '../../domain/Calculation';
import { colors, radius, spacing, typography } from '../theme';

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
        hitSlop={8}
        style={styles.toggle}
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
  toggle: { alignSelf: 'flex-start', marginTop: spacing.xs, minHeight: 32, justifyContent: 'center' },
  toggleText: { ...typography.caption, color: colors.brandStrong, textDecorationLine: 'underline' },
  box: {
    gap: spacing.xxs,
    marginTop: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  muted: { ...typography.caption, color: colors.textSecondary },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  total: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.xxs },
  key: { ...typography.caption, color: colors.text, flexShrink: 1 },
  value: { ...typography.caption, color: colors.text, fontVariant: ['tabular-nums'] },
  bold: { fontWeight: '700' },
});
