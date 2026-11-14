import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Chip } from '../../../../shared/presentation/components/Chip';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { SectionTitle } from '../../../../shared/presentation/components/SectionTitle';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import { properName, sentenceCase } from '../../../../shared/utils/formatCase';
import {
  CONCEPTS,
  parsePeriod,
  shiftPeriod,
  type MovementType,
  type PayrollSummary,
  type Period,
} from '../domain/Payroll';
import { usePayroll } from './usePayroll';

/** «Ver cálculo»: fórmula, periodo y cada dato con su clave y valor, tal como lo devuelve el API. */
function Calculation({ person }: { person: PayrollSummary }) {
  const { calculation } = person;
  return (
    <View style={styles.calc} accessibilityLabel={`Cálculo del neto de ${properName(person.name)}`}>
      <Text style={styles.calcText}>{calculation.formula}</Text>
      {calculation.period && (
        <Text
          style={styles.calcText}
        >{`Periodo: ${calculation.period.start} a ${calculation.period.end}`}</Text>
      )}
      {calculation.data.map((d) => (
        <View key={d.key} style={styles.row}>
          <Text style={styles.calcKey}>{d.key}</Text>
          <Text style={styles.calcValue}>{d.value.toFixed(2)}</Text>
        </View>
      ))}
      <View style={styles.row}>
        <Text style={styles.calcKey}>Resultado</Text>
        <Text style={[styles.calcValue, styles.bold]}>{person.net.toFixed(2)}</Text>
      </View>
    </View>
  );
}

/** Periodo como en la web: semana anterior o siguiente, o «Desde»/«Hasta» libres. */
function PeriodControls({ period, onChange }: { period: Period; onChange: (p: Period) => void }) {
  const [start, setStart] = useState(period.start);
  const [end, setEnd] = useState(period.end);
  const [error, setError] = useState<string | null>(null);
  const go = (p: Period) => {
    setStart(p.start);
    setEnd(p.end);
    setError(null);
    onChange(p);
  };
  const apply = () => {
    const p = parsePeriod(start, end);
    if ('error' in p) setError(p.error);
    else go(p);
  };
  return (
    <View style={styles.form}>
      <View style={styles.actions}>
        <Button label="Semana anterior" variant="outline" onPress={() => go(shiftPeriod(period, -1))} />
        <Button label="Semana siguiente" variant="outline" onPress={() => go(shiftPeriod(period, 1))} />
      </View>
      <View style={styles.actions}>
        <View style={styles.date}>
          <TextField
            label="Desde"
            value={start}
            onChangeText={setStart}
            placeholder="AAAA-MM-DD"
            maxLength={10}
          />
        </View>
        <View style={styles.date}>
          <TextField
            label="Hasta"
            value={end}
            onChangeText={setEnd}
            placeholder="AAAA-MM-DD"
            maxLength={10}
          />
        </View>
      </View>
      {error && <Notice tone="danger" message={error} />}
      <Button label="Ver periodo" variant="ghost" onPress={apply} />
    </View>
  );
}

/** Nómina del admin (Prioridad 3.1): neto del periodo, sumar o restar con justificación e historial. */
export function PayrollScreen() {
  const vm = usePayroll();
  const [open, setOpen] = useState<string | null>(null);
  const [showCalc, setShowCalc] = useState<string | null>(null);
  const [type, setType] = useState<MovementType>('resta');
  const [concept, setConcept] = useState('objeto_roto');
  const [amount, setAmount] = useState('');
  const [justification, setJustification] = useState('');
  const [correcting, setCorrecting] = useState<number | null>(null);
  const [correction, setCorrection] = useState('');

  if (vm.isLoading) return <LoadingState message="Cargando la nómina…" />;
  if (vm.error) return <ErrorState message={vm.error} onRetry={vm.refresh} />;

  const submit = async (employeeId: string) => {
    const ok = await vm.add({
      employeeId,
      type,
      concept,
      amount: Number(amount.replace(',', '.')),
      justification,
    });
    if (ok) {
      setOpen(null);
      setAmount('');
      setJustification('');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={vm.refresh} />}
    >
      <Text
        style={styles.hint}
      >{`Periodo del ${vm.period.start} al ${vm.period.end}. Solo controla la nómina: no se paga nada.`}</Text>
      <PeriodControls
        key={`${vm.period.start}-${vm.period.end}`}
        period={vm.period}
        onChange={vm.setPeriod}
      />
      {vm.message && <Notice tone={vm.message.tone} message={vm.message.text} />}
      <SectionTitle title="Neto del periodo" />
      {vm.summary.map((p) => (
        <Card key={p.employeeId} style={styles.card}>
          <Text style={styles.name}>{properName(p.name)}</Text>
          <Text style={styles.hint}>{sentenceCase(p.role)}</Text>
          <View style={styles.row}>
            <Text>{`Base ${formatCurrency(p.base)} · +${formatCurrency(p.additions)} · −${formatCurrency(p.deductions)}`}</Text>
          </View>
          <Text style={styles.net}>{`Neto ${formatCurrency(p.net)}`}</Text>
          <View style={styles.actions}>
            <Button
              label={showCalc === p.employeeId ? 'Ocultar cálculo' : 'Ver cálculo'}
              variant="ghost"
              onPress={() => setShowCalc(showCalc === p.employeeId ? null : p.employeeId)}
            />
            <Button
              label="Sumar o restar"
              variant="outline"
              onPress={() => setOpen(open === p.employeeId ? null : p.employeeId)}
              accessibilityLabel={`Sumar o restar a ${properName(p.name)}`}
            />
          </View>
          {showCalc === p.employeeId && <Calculation person={p} />}
          {open === p.employeeId && (
            <View style={styles.form}>
              <View style={styles.chips}>
                <Chip
                  label="Restar"
                  selected={type === 'resta'}
                  onPress={() => setType('resta')}
                  accessibilityRole="radio"
                />
                <Chip
                  label="Sumar"
                  selected={type === 'suma'}
                  onPress={() => setType('suma')}
                  accessibilityRole="radio"
                />
              </View>
              <View style={styles.chips}>
                {Object.entries(CONCEPTS)
                  .filter(([k]) => k !== 'correccion')
                  .map(([k, label]) => (
                    <Chip
                      key={k}
                      label={label}
                      selected={concept === k}
                      onPress={() => setConcept(k)}
                      accessibilityRole="radio"
                    />
                  ))}
              </View>
              <TextField label="Monto" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
              <TextField
                label="Justificación"
                value={justification}
                onChangeText={setJustification}
                multiline
                maxLength={500}
              />
              <Button label="Registrar" onPress={() => void submit(p.employeeId)} loading={vm.busy} />
            </View>
          )}
        </Card>
      ))}
      <SectionTitle title="Historial del periodo" />
      {vm.movements.length === 0 && <Text style={styles.hint}>Sin movimientos en el periodo.</Text>}
      {vm.movements.map((m) => (
        <Card key={m.id} style={styles.card}>
          <Text
            style={styles.name}
          >{`${m.type === 'suma' ? '+' : '−'}${formatCurrency(m.amount)} · ${CONCEPTS[m.concept] ?? m.concept}`}</Text>
          <Text>{properName(m.employee)}</Text>
          <Text style={styles.hint}>{sentenceCase(m.justification)}</Text>
          <Text style={styles.hint}>{`${m.date} · Registró ${properName(m.author)}`}</Text>
          {m.correctsId ? (
            <Text style={styles.hint}>{`Corrige el movimiento #${m.correctsId}`}</Text>
          ) : m.correctedBy ? (
            <Text style={styles.hint}>Corregido</Text>
          ) : correcting === m.id ? (
            <View style={styles.form}>
              <TextField label="¿Por qué se corrige?" value={correction} onChangeText={setCorrection} />
              <Button
                label="Registrar corrección"
                loading={vm.busy}
                onPress={() =>
                  void vm.correct(m.id, correction).then((ok) => {
                    if (ok) {
                      setCorrecting(null);
                      setCorrection('');
                    }
                  })
                }
              />
            </View>
          ) : (
            <Button
              label="Corregir"
              variant="ghost"
              onPress={() => setCorrecting(m.id)}
              accessibilityLabel={`Corregir el movimiento ${m.id}`}
            />
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  date: { flex: 1, minWidth: 140 },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { gap: spacing.xs },
  name: { ...typography.subheading, color: colors.text },
  net: { ...typography.subheading, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  form: { gap: spacing.sm, marginTop: spacing.sm },
  calc: {
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  calcText: { ...typography.caption, color: colors.textMuted },
  calcKey: { ...typography.caption, color: colors.text, fontFamily: 'monospace' },
  calcValue: { ...typography.caption, color: colors.text, fontFamily: 'monospace' },
  bold: { fontWeight: '700' },
});
