import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Chip } from '../../../../shared/presentation/components/Chip';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { SectionTitle } from '../../../../shared/presentation/components/SectionTitle';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { properName } from '../../../../shared/utils/formatCase';
import { SHAPES, type AdminTable, type Area } from '../domain/Tables';
import { useTables } from './useTables';

type Draft = { number: string; name: string; capacity: string; shape: string; areaId: number | null };
const draftOf = (t?: AdminTable): Draft => ({
  number: t?.number ?? '',
  name: t?.name ?? '',
  capacity: String(t?.capacity ?? 4),
  shape: t?.shape ?? 'cuadrada',
  areaId: t?.areaId ?? null,
});

function TableForm({
  initial,
  areas,
  busy,
  label,
  onSubmit,
}: {
  initial: Draft;
  areas: Area[];
  busy: boolean;
  label: string;
  onSubmit: (d: Draft) => void;
}) {
  const [d, setD] = useState(initial);
  return (
    <View style={styles.form}>
      <TextField
        label="Número"
        value={d.number}
        onChangeText={(number) => setD({ ...d, number })}
        maxLength={10}
        autoCapitalize="characters"
      />
      <TextField
        label="Capacidad"
        value={d.capacity}
        onChangeText={(capacity) => setD({ ...d, capacity })}
        keyboardType="number-pad"
      />
      <TextField
        label="Nombre (opcional)"
        value={d.name}
        onChangeText={(name) => setD({ ...d, name })}
        maxLength={50}
      />
      <Text style={styles.hint}>Área</Text>
      <View style={styles.chips}>
        <Chip
          label="Sin área"
          selected={d.areaId === null}
          onPress={() => setD({ ...d, areaId: null })}
          accessibilityRole="radio"
        />
        {areas.map((a) => (
          <Chip
            key={a.id}
            label={properName(a.name)}
            selected={d.areaId === a.id}
            onPress={() => setD({ ...d, areaId: a.id })}
            accessibilityRole="radio"
          />
        ))}
      </View>
      <Text style={styles.hint}>Forma</Text>
      <View style={styles.chips}>
        {Object.entries(SHAPES).map(([k, text]) => (
          <Chip
            key={k}
            label={text}
            selected={d.shape === k}
            onPress={() => setD({ ...d, shape: k })}
            accessibilityRole="radio"
          />
        ))}
      </View>
      <Button label={label} loading={busy} onPress={() => onSubmit(d)} />
    </View>
  );
}

/** Mesas del salón (Prioridad 1.3): alta, edición, activar o desactivar y baja, como en la web. */
export function TablesScreen() {
  const vm = useTables();
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [removing, setRemoving] = useState<number | null>(null);

  if (vm.isLoading) return <LoadingState message="Cargando las mesas…" />;
  if (vm.error) return <ErrorState message={vm.error} onRetry={vm.refresh} />;

  const save = (d: Draft, id?: number) =>
    void vm
      .save(
        {
          number: d.number,
          name: d.name || null,
          capacity: Number(d.capacity),
          shape: d.shape,
          areaId: d.areaId,
        },
        id,
      )
      .then((ok) => ok && setEditing(null));
  const active = vm.tables.filter((t) => t.active);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={vm.refresh} />}
    >
      <Text
        style={styles.hint}
      >{`${active.length} activas · ${active.reduce((s, t) => s + t.capacity, 0)} lugares. Las que tienen historial se desactivan en lugar de borrarse.`}</Text>
      {vm.message && <Notice tone={vm.message.tone} message={vm.message.text} />}
      {editing === 'new' ? (
        <Card>
          <SectionTitle title="Mesa nueva" />
          <TableForm
            initial={draftOf()}
            areas={vm.areas}
            busy={vm.busy}
            label="Añadir mesa"
            onSubmit={(d) => save(d)}
          />
        </Card>
      ) : (
        <Button label="Mesa nueva" onPress={() => setEditing('new')} />
      )}
      {vm.tables.map((t) => (
        <Card key={t.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{t.name ? `${t.number} · ${properName(t.name)}` : t.number}</Text>
            <StatusBadge label={t.active ? 'Activa' : 'Inactiva'} tone={t.active ? 'success' : 'neutral'} />
          </View>
          <Text style={styles.hint}>
            {`${t.areaName ? properName(t.areaName) : 'Sin área'} · ${t.capacity} pers. · ${SHAPES[t.shape ?? ''] ?? '—'} · ${t.upcomingReservations} reservas por venir`}
          </Text>
          <View style={styles.actions}>
            <Button
              label={t.active ? 'Desactivar' : 'Activar'}
              variant="ghost"
              onPress={() => void vm.toggle(t)}
              accessibilityLabel={`${t.active ? 'Desactivar' : 'Activar'} la mesa ${t.number}`}
            />
            <Button
              label="Editar"
              variant="outline"
              onPress={() => setEditing(editing === t.id ? null : t.id)}
              accessibilityLabel={`Editar la mesa ${t.number}`}
            />
            <Button
              label="Dar de baja"
              variant="ghost"
              onPress={() => setRemoving(t.id)}
              accessibilityLabel={`Dar de baja la mesa ${t.number}`}
            />
          </View>
          {editing === t.id && (
            <TableForm
              initial={draftOf(t)}
              areas={vm.areas}
              busy={vm.busy}
              label="Guardar cambios"
              onSubmit={(d) => save(d, t.id)}
            />
          )}
          {removing === t.id && (
            <View style={styles.form}>
              <Text style={styles.hint}>
                {t.hasHistory || t.upcomingReservations > 0
                  ? 'Tiene historial o reservas activas: se desactivará y se conserva todo.'
                  : 'No tiene historial: se borrará (queda archivada).'}
              </Text>
              <View style={styles.actions}>
                <Button label="Cancelar" variant="outline" onPress={() => setRemoving(null)} />
                <Button
                  label={t.hasHistory || t.upcomingReservations > 0 ? 'Desactivar mesa' : 'Eliminar mesa'}
                  loading={vm.busy}
                  onPress={() => void vm.remove(t).then(() => setRemoving(null))}
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
  hint: { ...typography.caption, color: colors.textMuted },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  form: { gap: spacing.sm, marginTop: spacing.sm },
});
