import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { SectionTitle } from '../../../../shared/presentation/components/SectionTitle';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import type { EmployeeErrors, EmployeeInput, PayrollEmployee } from '../domain/Employees';
import { useEmployees } from './useEmployees';

function EmployeeForm({
  original,
  errors,
  busy,
  onSubmit,
}: {
  original?: PayrollEmployee;
  errors: EmployeeErrors;
  busy: boolean;
  onSubmit: (d: EmployeeInput) => void;
}) {
  const [name, setName] = useState(original?.name ?? '');
  const [role, setRole] = useState(original?.role ?? '');
  const [pay, setPay] = useState(original ? String(original.weeklyPay) : '');
  const [active, setActive] = useState(original?.active ?? true);
  const weeklyPay = pay.trim() === '' ? Number.NaN : Number(pay.replace(',', '.'));
  return (
    <View style={styles.form}>
      <TextField label="Nombre" value={name} onChangeText={setName} error={errors.name} maxLength={120} />
      <TextField
        label="Puesto"
        value={role}
        onChangeText={setRole}
        error={errors.role}
        maxLength={60}
        placeholder="Chef 1, Mesero 2, Gerente…"
      />
      <TextField
        label="Pago semanal"
        value={pay}
        onChangeText={setPay}
        error={errors.weeklyPay}
        keyboardType="decimal-pad"
        placeholder="En pesos"
      />
      <View style={styles.row}>
        <Text style={styles.label}>Activo en la nómina</Text>
        <Switch value={active} onValueChange={setActive} accessibilityLabel="Activo en la nómina" />
      </View>
      <Text style={styles.hint}>Los inactivos no cuentan en los totales.</Text>
      <Button
        label={original ? 'Guardar cambios' : 'Añadir'}
        loading={busy}
        onPress={() => onSubmit({ name, role, weeklyPay, active })}
      />
    </View>
  );
}

/** Empleados de la nómina (Fase 2): como «Nómina» en la web (añadir, editar, activar y quitar). */
export function PayrollEmployeesScreen() {
  const vm = useEmployees();
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  if (vm.isLoading) return <LoadingState message="Cargando la nómina…" />;
  if (vm.error) return <ErrorState message={vm.error} onRetry={() => void vm.refresh()} />;

  const open = (id: string | 'new' | null) => {
    vm.clearErrors();
    setEditing(id);
  };
  const active = vm.employees.filter((e) => e.active);
  const weekly = active.reduce((s, e) => s + e.weeklyPay, 0);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => void vm.refresh()} />}
    >
      <Text style={styles.hint}>{`${active.length} activos · ${formatCurrency(weekly)} por semana.`}</Text>
      {vm.message && <Notice tone={vm.message.tone} message={vm.message.text} />}
      {editing === 'new' ? (
        <Card>
          <SectionTitle title="Añadir a la nómina" />
          <EmployeeForm
            errors={vm.fieldErrors}
            busy={vm.busy}
            onSubmit={(d) => void vm.save(d).then((ok) => ok && setEditing(null))}
          />
          <Button label="Cancelar" variant="ghost" onPress={() => open(null)} />
        </Card>
      ) : (
        <Button label="Añadir a la nómina" onPress={() => open('new')} />
      )}
      {vm.employees.map((e) => (
        <Card key={e.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{e.name}</Text>
            <StatusBadge label={e.active ? 'Activo' : 'Inactivo'} tone={e.active ? 'success' : 'neutral'} />
          </View>
          <Text style={styles.hint}>{`${e.role} · ${formatCurrency(e.weeklyPay)} por semana`}</Text>
          <View style={styles.actions}>
            <Button
              label="Editar"
              variant="outline"
              onPress={() => open(editing === e.id ? null : e.id)}
              accessibilityLabel={`Editar a ${e.name}`}
            />
            <Button
              label={e.active ? 'Desactivar' : 'Activar'}
              variant="ghost"
              onPress={() => void vm.toggle(e)}
              accessibilityLabel={`${e.active ? 'Desactivar' : 'Activar'} a ${e.name} en la nómina`}
            />
            <Button
              label="Quitar"
              variant="ghost"
              onPress={() => setRemoving(e.id)}
              accessibilityLabel={`Quitar a ${e.name} de la nómina`}
            />
          </View>
          {editing === e.id && (
            <EmployeeForm
              original={e}
              errors={vm.fieldErrors}
              busy={vm.busy}
              onSubmit={(d) => void vm.save(d, e.id).then((ok) => ok && setEditing(null))}
            />
          )}
          {removing === e.id && (
            <View style={styles.form}>
              <Text style={styles.hint}>
                {`¿Quitar a ${e.name} de la nómina? Se borra su registro de pagos. No se puede deshacer.`}
              </Text>
              <View style={styles.actions}>
                <Button label="Cancelar" variant="outline" onPress={() => setRemoving(null)} />
                <Button
                  label="Quitar de la nómina"
                  loading={vm.busy}
                  onPress={() => void vm.remove(e).then(() => setRemoving(null))}
                />
              </View>
            </View>
          )}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxxl },
  card: { gap: spacing.xs },
  name: { ...typography.subheading, color: colors.text },
  label: { ...typography.body, color: colors.text },
  hint: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  form: { gap: spacing.sm, marginTop: spacing.sm },
});
