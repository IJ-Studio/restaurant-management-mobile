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
import {
  CREATABLE_ROLES,
  ROLE_LABELS,
  type StaffErrors,
  type StaffInput,
  type StaffMember,
} from '../domain/Staff';
import { useStaff } from './useStaff';

const fullName = (u: StaffMember) => `${properName(u.name)} ${properName(u.lastname)}`.trim();
const draftOf = (u?: StaffMember): StaffInput => ({
  name: u?.name ?? '',
  lastname: u?.lastname ?? '',
  email: u?.email ?? '',
  phone: u?.phone?.replace(/^\+52/, '') ?? '',
  password: '',
  roleId: u?.roleId ?? CREATABLE_ROLES[0],
});

function StaffForm({
  original,
  errors,
  busy,
  onSubmit,
}: {
  original?: StaffMember;
  errors: StaffErrors;
  busy: boolean;
  onSubmit: (d: StaffInput) => void;
}) {
  const [d, setD] = useState(() => draftOf(original));
  // El rol de administrador no se cambia desde aquí (el API solo asigna los que se pueden crear).
  const roles: readonly number[] = original?.roleId === 1 ? [1] : CREATABLE_ROLES;
  return (
    <View style={styles.form}>
      <TextField
        label="Nombre"
        value={d.name}
        onChangeText={(name) => setD({ ...d, name })}
        error={errors.name}
        maxLength={50}
      />
      <TextField
        label="Apellidos"
        value={d.lastname}
        onChangeText={(lastname) => setD({ ...d, lastname })}
        error={errors.lastname}
        maxLength={50}
      />
      {!original && (
        <TextField
          label="Correo"
          value={d.email}
          onChangeText={(email) => setD({ ...d, email })}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="off"
        />
      )}
      <TextField
        label="Teléfono"
        value={d.phone}
        onChangeText={(phone) => setD({ ...d, phone })}
        error={errors.phone}
        keyboardType="phone-pad"
        maxLength={20}
      />
      <Text style={styles.hint}>Rol</Text>
      <View style={styles.chips} accessibilityRole="radiogroup">
        {roles.map((r) => (
          <Chip
            key={r}
            label={ROLE_LABELS[r]}
            selected={d.roleId === r}
            onPress={() => setD({ ...d, roleId: r })}
            accessibilityRole="radio"
          />
        ))}
      </View>
      {errors.roleId && <Text style={styles.error}>{errors.roleId}</Text>}
      {!original && (
        <TextField
          label="Contraseña"
          value={d.password}
          onChangeText={(password) => setD({ ...d, password })}
          error={errors.password}
          secureTextEntry
          autoComplete="new-password"
        />
      )}
      <Button
        label={original ? 'Guardar cambios' : 'Crear usuario'}
        loading={busy}
        onPress={() => onSubmit(d)}
      />
    </View>
  );
}

const FILTERS = { todos: 'Todos', activos: 'Activos', inactivos: 'Inactivos' } as const;

/** Usuarios y personal (Fase 2): alta, edición, rol, desactivar y activar, como Usuarios en la web. */
export function StaffScreen() {
  const vm = useStaff();
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<keyof typeof FILTERS>('todos');

  if (vm.isLoading) return <LoadingState message="Cargando el personal…" />;
  if (vm.error) return <ErrorState message={vm.error} onRetry={vm.refresh} />;

  const open = (id: number | 'new' | null) => {
    vm.clearErrors();
    setEditing(id);
  };
  const q = query.trim().toLowerCase();
  const visible = vm.staff.filter(
    (u) =>
      (!q || `${u.name} ${u.lastname} ${u.email}`.toLowerCase().includes(q)) &&
      (filter === 'todos' || (filter === 'activos' ? u.active : !u.active)),
  );
  const active = vm.staff.filter((u) => u.active).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={false} onRefresh={vm.refresh} />}
    >
      <Text
        style={styles.hint}
      >{`${active} activos de ${vm.staff.length}. Desactivar no borra: la persona deja de entrar y se puede volver a activar.`}</Text>
      {vm.message && <Notice tone={vm.message.tone} message={vm.message.text} />}
      {editing === 'new' ? (
        <Card>
          <SectionTitle title="Usuario nuevo" />
          <StaffForm
            errors={vm.fieldErrors}
            busy={vm.busy}
            onSubmit={(d) => void vm.save(d).then((ok) => ok && setEditing(null))}
          />
          <Button label="Cancelar" variant="ghost" onPress={() => open(null)} />
        </Card>
      ) : (
        <Button label="Usuario nuevo" onPress={() => open('new')} />
      )}
      <TextField
        label="Buscar"
        value={query}
        onChangeText={setQuery}
        placeholder="Nombre o correo"
        autoCapitalize="none"
      />
      <View style={styles.chips} accessibilityRole="radiogroup">
        {Object.entries(FILTERS).map(([k, label]) => (
          <Chip
            key={k}
            label={label}
            selected={filter === k}
            onPress={() => setFilter(k as keyof typeof FILTERS)}
            accessibilityRole="radio"
          />
        ))}
      </View>
      {visible.length === 0 && (
        <Text style={styles.hint}>Nada que mostrar. Prueba con otra búsqueda o con otro filtro.</Text>
      )}
      {visible.map((u) => (
        <Card key={u.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{fullName(u)}</Text>
            <StatusBadge label={u.active ? 'Activo' : 'Inactivo'} tone={u.active ? 'success' : 'neutral'} />
          </View>
          <Text
            style={styles.hint}
          >{`${ROLE_LABELS[u.roleId] ?? 'Sin rol'} · ${u.email}${u.phone ? ` · ${u.phone}` : ''}`}</Text>
          <View style={styles.actions}>
            <Button
              label="Editar"
              variant="outline"
              onPress={() => open(editing === u.id ? null : u.id)}
              accessibilityLabel={`Editar a ${fullName(u)}`}
            />
            <Button
              label={u.active ? 'Desactivar' : 'Activar'}
              variant="ghost"
              onPress={() => setConfirming(u.id)}
              accessibilityLabel={`${u.active ? 'Desactivar' : 'Activar'} a ${fullName(u)}`}
            />
          </View>
          {editing === u.id && (
            <StaffForm
              original={u}
              errors={vm.fieldErrors}
              busy={vm.busy}
              onSubmit={(d) => void vm.save(d, u).then((ok) => ok && setEditing(null))}
            />
          )}
          {confirming === u.id && (
            <View style={styles.form}>
              <Text style={styles.hint}>
                {u.active
                  ? 'No podrá entrar al sistema hasta que la vuelvas a activar.'
                  : 'Podrá volver a entrar con su correo y su contraseña.'}
              </Text>
              <View style={styles.actions}>
                <Button label="Cancelar" variant="outline" onPress={() => setConfirming(null)} />
                <Button
                  label={u.active ? 'Desactivar' : 'Activar'}
                  loading={vm.busy}
                  onPress={() => void vm.toggle(u).then(() => setConfirming(null))}
                  accessibilityLabel={`Confirmar: ${u.active ? 'desactivar' : 'activar'} a ${fullName(u)}`}
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
  error: { ...typography.caption, color: colors.danger },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  form: { gap: spacing.sm, marginTop: spacing.sm },
});
