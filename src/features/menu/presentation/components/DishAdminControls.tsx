import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import type { Dish } from '../../domain/entities/Dish';
import { useDishAdmin } from '../viewmodels/useDishAdmin';

/** Administración rápida del platillo desde la móvil: agotarlo al momento y corregir el precio. */
export function DishAdminControls({ dish }: { dish: Dish }) {
  const vm = useDishAdmin(dish);
  return (
    <Card style={styles.card}>
      <Text style={styles.title} accessibilityRole="header">
        Administrar platillo
      </Text>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.label}>Disponible para pedir</Text>
          <Text style={styles.hint}>
            Apágalo cuando se acabe: deja de poder pedirse en la app y en la web.
          </Text>
        </View>
        <Switch
          value={vm.available}
          onValueChange={vm.setAvailable}
          disabled={vm.isSavingAvailability}
          accessibilityLabel="Disponible para pedir"
          trackColor={{ true: colors.brand, false: colors.border }}
        />
      </View>
      <TextField
        label="Precio ($)"
        value={vm.priceText}
        onChangeText={vm.setPriceText}
        keyboardType="decimal-pad"
        style={styles.price}
      />
      <Button
        label="Guardar precio"
        variant="outline"
        onPress={vm.savePrice}
        loading={vm.isSavingPrice}
        disabled={!vm.priceChanged}
      />
      {vm.notice && <Notice tone="success" message={vm.notice} style={styles.notice} />}
      {vm.error && <Notice message={vm.error} style={styles.notice} />}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: spacing.lg, gap: spacing.md },
  title: { ...typography.bodyStrong, color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1 },
  label: { ...typography.bodyStrong, color: colors.text },
  hint: { ...typography.caption, color: colors.textSecondary },
  price: { marginTop: spacing.xs },
  notice: { marginTop: spacing.xs },
});
