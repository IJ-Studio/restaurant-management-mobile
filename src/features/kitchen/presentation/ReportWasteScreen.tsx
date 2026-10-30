import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../shared/presentation/components/Button';
import { Card } from '../../../shared/presentation/components/Card';
import { Chip } from '../../../shared/presentation/components/Chip';
import { Notice } from '../../../shared/presentation/components/Notice';
import { TextField } from '../../../shared/presentation/components/TextField';
import { colors, radius, sizes, spacing, typography } from '../../../shared/presentation/theme';
import { formatCurrency } from '../../../shared/utils/formatCurrency';
import { WASTE_REASONS } from '../domain/Kitchen';
import { useReportWaste } from './viewmodels';

type Vm = ReturnType<typeof useReportWaste>;

function ProductPicker({ vm }: { vm: Vm }) {
  if (vm.product) {
    return (
      <Card style={styles.selected}>
        <Ionicons name="cube-outline" size={22} color={colors.brandStrong} />
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedName}>{vm.product.name}</Text>
          <Text style={styles.selectedMeta}>
            En inventario: {vm.product.stock} {vm.product.unit} · {formatCurrency(vm.product.costPerUnit)}/
            {vm.product.unit}
          </Text>
        </View>
        <Button label="Cambiar" variant="ghost" onPress={() => vm.selectProduct(null)} />
      </Card>
    );
  }
  return (
    <>
      <TextField
        label="Buscar en el inventario"
        accessibilityLabel="Buscar producto"
        value={vm.search}
        onChangeText={vm.setSearch}
        placeholder="Aguacate, tortilla, crema…"
        autoCorrect={false}
      />
      {vm.productsError && <Notice tone="warning" message={vm.productsError} style={styles.notice} />}
      <View style={styles.matches}>
        {vm.matches.map((product) => (
          <Pressable
            key={product.id}
            onPress={() => vm.selectProduct(product)}
            accessibilityRole="button"
            accessibilityLabel={`${product.name}, ${product.stock} ${product.unit} en inventario`}
            style={({ pressed }) => [styles.match, pressed && styles.matchPressed]}
          >
            <Text style={styles.matchName}>{product.name}</Text>
            <Text style={styles.matchMeta}>
              {product.stock} {product.unit}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextField
        label="¿No está en el inventario? Escríbelo"
        accessibilityLabel="Producto fuera del inventario"
        value={vm.freeName}
        onChangeText={vm.setFreeName}
        placeholder="Salsa verde de la casa"
        style={styles.field}
      />
    </>
  );
}

/** Registro de merma: qué se perdió, cuánto, por qué. Descuenta del inventario si es un producto. */
export function ReportWasteScreen() {
  const navigation = useNavigation();
  const vm = useReportWaste(() => navigation.goBack());

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Producto</Text>
        <ProductPicker vm={vm} />

        <Text style={styles.section}>Cantidad</Text>
        <View style={styles.qtyRow}>
          <TextField
            label={vm.product ? `Cantidad (${vm.product.unit})` : 'Cantidad'}
            accessibilityLabel="Cantidad perdida"
            value={vm.quantityText}
            onChangeText={vm.setQuantityText}
            keyboardType="decimal-pad"
            placeholder="0"
            style={styles.qty}
          />
          {!vm.product && (
            <TextField
              label="Unidad"
              accessibilityLabel="Unidad"
              value={vm.unit}
              onChangeText={vm.setUnit}
              placeholder="kg, pza, lt"
              autoCapitalize="none"
              maxLength={20}
              style={styles.unit}
            />
          )}
        </View>
        {vm.estimatedCost !== undefined && (
          <Text style={styles.cost} accessibilityLabel={`Costo estimado ${formatCurrency(vm.estimatedCost)}`}>
            Costo estimado: {formatCurrency(vm.estimatedCost)}
          </Text>
        )}

        <Text style={styles.section}>Motivo</Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          {WASTE_REASONS.map((reason) => (
            <Chip
              key={reason.value}
              label={reason.label}
              selected={vm.reason === reason.value}
              onPress={() => vm.setReason(reason.value)}
            />
          ))}
        </View>

        <TextField
          label="¿Qué pasó?"
          accessibilityLabel="Justificación"
          value={vm.justification}
          onChangeText={vm.setJustification}
          placeholder="Se quedó fuera del refrigerador toda la noche"
          multiline
          maxLength={300}
          style={styles.field}
        />

        {vm.errorMessage && <Notice message={vm.errorMessage} style={styles.notice} />}
        <Button label="Registrar merma" onPress={vm.submit} loading={vm.isSending} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  section: {
    ...typography.overline,
    color: colors.brandStrong,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  selected: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  selectedInfo: { flex: 1 },
  selectedName: { ...typography.subheading, color: colors.text },
  selectedMeta: { ...typography.caption, color: colors.textSecondary },
  matches: { marginTop: spacing.sm, gap: spacing.xs },
  match: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: sizes.touchTarget,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  matchPressed: { backgroundColor: colors.elevated },
  matchName: { ...typography.bodyStrong, color: colors.text },
  matchMeta: { ...typography.caption, color: colors.textSecondary },
  qtyRow: { flexDirection: 'row', gap: spacing.md },
  qty: { flex: 1 },
  unit: { flex: 1 },
  cost: { ...typography.caption, color: colors.warning, marginTop: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  field: { marginTop: spacing.lg },
  notice: { marginTop: spacing.md },
  submit: { marginTop: spacing.xl },
});
