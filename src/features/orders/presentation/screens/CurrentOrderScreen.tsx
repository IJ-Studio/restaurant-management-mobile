import { useNavigation } from '@react-navigation/native';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../../../../shared/presentation/components/Card';
import { formatPrice } from '../../../../shared/presentation/format';
import { useCurrentOrder } from '../viewmodels/useCurrentOrder';

/** Pedido en curso de la mesa (local). Enviar a cocina y cobrar llegan con el resto de HU-05. */
export function CurrentOrderScreen() {
  const navigation = useNavigation<{ navigate: (route: 'menu') => void }>();
  const vm = useCurrentOrder();

  const tablePicker = (
    <View style={styles.picker}>
      <Text style={styles.label}>Número de mesa</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.flex]}
          value={vm.tableInput}
          onChangeText={vm.setTableInput}
          accessibilityLabel="Número de mesa"
          keyboardType="number-pad"
          maxLength={3}
          returnKeyType="done"
          onSubmitEditing={() => vm.openTable()}
        />
        <Pressable style={styles.primary} onPress={() => vm.openTable()} accessibilityRole="button">
          <Text style={styles.primaryText}>Abrir mesa</Text>
        </Pressable>
      </View>
      {vm.tableError ? <Text style={styles.error}>{vm.tableError}</Text> : null}
      {vm.openTables.length > 0 ? (
        <View style={styles.chips}>
          {vm.openTables.map((table) => (
            <Pressable
              key={table}
              onPress={() => vm.openTable(table)}
              style={[styles.chip, vm.order?.table === table && styles.chipActive]}
              accessibilityRole="button"
              accessibilityLabel={`Mesa ${table}`}
              accessibilityState={{ selected: vm.order?.table === table }}
            >
              <Text style={[styles.chipText, vm.order?.table === table && styles.chipTextActive]}>Mesa {table}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (!vm.order) {
    return <View style={styles.container}>{tablePicker}</View>;
  }

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={vm.order.lines}
      keyExtractor={(line) => line.dishId}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          {tablePicker}
          <Text style={styles.title} accessibilityRole="header">
            Mesa {vm.order.table}
          </Text>
        </View>
      }
      ListEmptyComponent={<Text style={styles.empty}>Sin platillos. Agrégalos desde el menú.</Text>}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <Card style={styles.line}>
          <View style={styles.flex}>
            <Text style={styles.lineName}>{item.name}</Text>
            <Text style={styles.linePrice}>{formatPrice(item.unitPrice * item.quantity)}</Text>
          </View>
          <Pressable
            style={styles.stepper}
            onPress={() => vm.decrement(item.dishId, item.quantity)}
            accessibilityRole="button"
            accessibilityLabel={`Quitar uno de ${item.name}`}
          >
            <Text style={styles.stepperText}>−</Text>
          </Pressable>
          <Text style={styles.quantity} accessibilityLabel={`${item.quantity} de ${item.name}`}>
            {item.quantity}
          </Text>
          <Pressable
            style={styles.stepper}
            onPress={() => vm.increment(item.dishId, item.quantity)}
            accessibilityRole="button"
            accessibilityLabel={`Agregar uno de ${item.name}`}
          >
            <Text style={styles.stepperText}>+</Text>
          </Pressable>
        </Card>
      )}
      ListFooterComponent={
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>
              Total estimado ({vm.count} {vm.count === 1 ? 'platillo' : 'platillos'})
            </Text>
            <Text style={styles.total}>{formatPrice(vm.total)}</Text>
          </View>
          <Pressable style={styles.primary} onPress={() => navigation.navigate('menu')} accessibilityRole="button">
            <Text style={styles.primaryText}>Agregar platillos</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={vm.discard} accessibilityRole="button">
            <Text style={styles.secondaryText}>Descartar pedido de la mesa</Text>
          </Pressable>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  picker: { gap: 8 },
  headerBlock: { gap: 16, marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#111' },
  error: { color: '#b00020', fontSize: 13 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#1f6feb' },
  chipActive: { backgroundColor: '#1f6feb' },
  chipText: { color: '#1f6feb', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  empty: { color: '#777', textAlign: 'center', marginVertical: 24 },
  separator: { height: 8 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lineName: { fontSize: 16, fontWeight: '600', color: '#111' },
  linePrice: { fontSize: 14, color: '#555' },
  stepper: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#1f6feb', alignItems: 'center', justifyContent: 'center' },
  stepperText: { fontSize: 20, color: '#1f6feb', fontWeight: '600' },
  quantity: { minWidth: 24, textAlign: 'center', fontSize: 16, fontWeight: '600' },
  footer: { marginTop: 16, gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 14, color: '#555' },
  total: { fontSize: 20, fontWeight: '700', color: '#111' },
  primary: { backgroundColor: '#1f6feb', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { color: '#b00020', fontSize: 14, fontWeight: '600' },
});
