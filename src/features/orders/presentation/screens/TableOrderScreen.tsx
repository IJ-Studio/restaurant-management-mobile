import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card } from '../../../../shared/presentation/components/Card';
import { ScreenState } from '../../../../shared/presentation/components/ScreenState';
import { colors, spacing } from '../../../../shared/presentation/theme';
import { formatCurrency } from '../../../../shared/utils/formatCurrency';
import type { OrderLine } from '../../domain/entities/TableOrder';
import { useTableOrder } from '../viewmodels/useTableOrder';

function QuantityStepper({ line, onChange }: { line: OrderLine; onChange: (quantity: number) => void }) {
  return (
    <View style={styles.stepper}>
      <Pressable
        style={styles.step}
        onPress={() => onChange(line.quantity - 1)}
        accessibilityRole="button"
        accessibilityLabel={`Quitar uno de ${line.name}`}
      >
        <Text style={styles.stepText}>−</Text>
      </Pressable>
      <Text style={styles.quantity}>{line.quantity}</Text>
      <Pressable
        style={styles.step}
        onPress={() => onChange(line.quantity + 1)}
        accessibilityRole="button"
        accessibilityLabel={`Agregar uno de ${line.name}`}
      >
        <Text style={styles.stepText}>+</Text>
      </Pressable>
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
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Mesa</Text>
      {vm.tablesError ? (
        <Text style={styles.error}>{vm.tablesError}</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tables}>
          {vm.tables.map((table) => {
            const selected = vm.order.tableNumber === table.number;
            return (
              <Pressable
                key={table.id}
                style={[styles.table, selected && styles.tableSelected]}
                onPress={() => vm.selectTable(table.number)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Mesa ${table.number}`}
              >
                <Text style={selected ? styles.tableTextSelected : styles.tableText}>{table.number}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <FlatList
        data={vm.order.lines}
        keyExtractor={(line) => String(line.dishId)}
        renderItem={({ item }) => (
          <View style={styles.line}>
            <View style={styles.lineInfo}>
              <Text style={styles.lineName}>{item.name}</Text>
              <Text style={styles.linePrice}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
            </View>
            <QuantityStepper line={item} onChange={(quantity) => vm.setQuantity(item.dishId, quantity)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <Card style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{vm.count} platillos · Total estimado</Text>
          <Text style={styles.total}>{formatCurrency(vm.total)}</Text>
        </View>
        {vm.sendError && (
          <Text style={styles.error} accessibilityRole="alert">
            {vm.sendError}
          </Text>
        )}
        <Pressable
          style={[styles.send, vm.isSending && styles.sendDisabled]}
          onPress={vm.sendToKitchen}
          disabled={vm.isSending}
          accessibilityRole="button"
          accessibilityLabel="Enviar a cocina"
        >
          {vm.isSending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>Enviar a cocina</Text>
          )}
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    margin: spacing.md,
    marginBottom: spacing.sm,
  },
  tables: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  table: {
    minWidth: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  tableSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  tableText: { color: colors.text, fontWeight: '600' },
  tableTextSelected: { color: '#fff', fontWeight: '700' },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  lineInfo: { flex: 1 },
  lineName: { fontSize: 16, color: colors.text, fontWeight: '600' },
  linePrice: { fontSize: 14, color: colors.muted, marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  step: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { color: colors.primary, fontSize: 18 },
  quantity: { minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: '700' },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.lg },
  footer: { margin: spacing.md },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: colors.muted },
  total: { fontSize: 20, fontWeight: '700', color: colors.text },
  error: { color: colors.danger, marginHorizontal: spacing.md, marginTop: spacing.sm, textAlign: 'center' },
  send: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.7 },
  sendText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
