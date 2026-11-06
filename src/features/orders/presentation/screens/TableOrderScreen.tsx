import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { FloorMap } from '../../../../shared/presentation/components/FloorMap';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { ScreenState } from '../../../../shared/presentation/components/ScreenState';
import { TextField } from '../../../../shared/presentation/components/TextField';
import {
  colors,
  pressScale,
  radius,
  sizes,
  spacing,
  typography,
} from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import {
  MAX_GUESTS,
  MAX_KITCHEN_NOTE,
  MAX_LINE_NOTE,
  type OrderLine,
} from '../../domain/entities/TableOrder';
import { useTableOrder } from '../viewmodels/useTableOrder';

function StepButton({ symbol, label, onPress }: { symbol: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.step, pressed && styles.stepPressed, pressed && pressScale]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.stepText}>{symbol}</Text>
    </Pressable>
  );
}

function QuantityStepper({ line, onChange }: { line: OrderLine; onChange: (quantity: number) => void }) {
  return (
    <View style={styles.stepper}>
      <StepButton
        symbol="−"
        label={`Quitar uno de ${line.name}`}
        onPress={() => onChange(line.quantity - 1)}
      />
      <Text style={styles.quantity}>{line.quantity}</Text>
      <StepButton
        symbol="+"
        label={`Agregar uno de ${line.name}`}
        onPress={() => onChange(line.quantity + 1)}
      />
    </View>
  );
}

function LineRow({
  line,
  onQuantity,
  onNotes,
}: {
  line: OrderLine;
  onQuantity: (quantity: number) => void;
  onNotes: (notes: string) => void;
}) {
  const [editing, setEditing] = useState(Boolean(line.notes));
  return (
    <View style={styles.line}>
      <View style={styles.lineRow}>
        <View style={styles.lineInfo}>
          <Text style={styles.lineName}>{line.name}</Text>
          <Text style={styles.linePrice}>{formatCurrency(line.unitPrice * line.quantity)}</Text>
        </View>
        <QuantityStepper line={line} onChange={onQuantity} />
      </View>
      {editing ? (
        <TextField
          label="Nota para cocina"
          accessibilityLabel={`Nota de ${line.name}`}
          value={line.notes ?? ''}
          onChangeText={onNotes}
          placeholder="Sin cebolla, término medio…"
          maxLength={MAX_LINE_NOTE}
          style={styles.noteField}
        />
      ) : (
        <Pressable
          onPress={() => setEditing(true)}
          accessibilityRole="button"
          accessibilityLabel={`Agregar nota a ${line.name}`}
          style={styles.addNote}
          hitSlop={spacing.sm}
        >
          <Ionicons name="create-outline" size={16} color={colors.brandStrong} />
          <Text style={styles.addNoteText}>Agregar nota</Text>
        </Pressable>
      )}
    </View>
  );
}

export function TableOrderScreen() {
  const vm = useTableOrder();

  if (vm.sentMessage && vm.order.lines.length === 0) {
    return (
      <ScreenState
        kind="empty"
        message={`${vm.sentMessage} El pedido de la mesa quedó vacío para el siguiente.`}
      />
    );
  }
  if (vm.order.lines.length === 0) {
    return <ScreenState kind="empty" message="Agrega platillos desde el menú." />;
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Mesa</Text>
        {vm.tablesError ? (
          <Text style={styles.tablesError}>{vm.tablesError}</Text>
        ) : (
          <FloorMap
            tables={vm.floor}
            selectedNumber={vm.order.tableNumber}
            onSelect={(table) => vm.selectTable(table.number)}
          />
        )}

        <Text style={styles.sectionTitle}>Comensales</Text>
        <Card style={styles.guests}>
          <Ionicons name="people-outline" size={22} color={colors.brandStrong} />
          <Text style={styles.guestsLabel}>Personas en la mesa</Text>
          <View style={styles.stepper}>
            <StepButton symbol="−" label="Menos comensales" onPress={() => vm.setGuests(vm.guests - 1)} />
            <Text style={styles.quantity} accessibilityLabel={`${vm.guests} comensales`}>
              {vm.guests}
            </Text>
            <StepButton
              symbol="+"
              label="Más comensales"
              onPress={() => vm.setGuests(Math.min(MAX_GUESTS, vm.guests + 1))}
            />
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Platillos</Text>
        <View style={styles.lines}>
          {vm.order.lines.map((line) => (
            <LineRow
              key={line.dishId}
              line={line}
              onQuantity={(quantity) => vm.setQuantity(line.dishId, quantity)}
              onNotes={(notes) => vm.setLineNotes(line.dishId, notes)}
            />
          ))}
        </View>

        <TextField
          label="Nota general para cocina (opcional)"
          accessibilityLabel="Nota para cocina"
          value={vm.order.kitchenNote ?? ''}
          onChangeText={vm.setKitchenNote}
          placeholder="Alergias, llevar todo junto…"
          maxLength={MAX_KITCHEN_NOTE}
          multiline
          style={styles.kitchenNote}
        />
      </ScrollView>

      <Card elevation="raised" style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{vm.count} platillos · Total estimado</Text>
          <Text style={styles.total}>{formatCurrency(vm.total)}</Text>
        </View>
        {vm.sendError && <Notice message={vm.sendError} style={styles.notice} />}
        <Button
          label="Enviar a cocina"
          onPress={vm.sendToKitchen}
          loading={vm.isSending}
          style={styles.send}
        />
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  sectionTitle: {
    ...typography.overline,
    color: colors.brandStrong,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  tablesError: { ...typography.small, color: colors.danger },
  guests: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  guestsLabel: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  lines: { gap: spacing.sm },
  line: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lineRow: { flexDirection: 'row', alignItems: 'center' },
  lineInfo: { flex: 1, marginRight: spacing.md },
  lineName: { ...typography.subheading, color: colors.text },
  linePrice: { ...typography.bodyStrong, color: colors.brandStrong, marginTop: spacing.xxs },
  addNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
  addNoteText: { ...typography.caption, color: colors.brandStrong },
  noteField: { marginTop: spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  step: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPressed: { backgroundColor: colors.brandSoft },
  stepText: { ...typography.heading, color: colors.brandStrong },
  quantity: { ...typography.heading, color: colors.text, minWidth: spacing.xxl, textAlign: 'center' },
  kitchenNote: { marginTop: spacing.lg },
  footer: { margin: spacing.lg, marginTop: 0 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  totalLabel: { ...typography.small, color: colors.textSecondary, flexShrink: 1 },
  total: { ...typography.title, color: colors.text },
  notice: { marginTop: spacing.md },
  send: { marginTop: spacing.lg },
});
