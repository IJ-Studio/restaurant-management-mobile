import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { ComponentProps } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../shared/presentation/components/Button';
import { Chip } from '../../../shared/presentation/components/Chip';
import { Notice } from '../../../shared/presentation/components/Notice';
import { TextField } from '../../../shared/presentation/components/TextField';
import { colors, pressScale, radius, sizes, spacing, typography } from '../../../shared/presentation/theme';
import { DELAY_MINUTES, INCIDENT_TYPES } from '../domain/Kitchen';
import { useReportIncident } from './viewmodels';

export type ReportIncidentParams = { orderId?: string; place?: string } | undefined;

type IconName = ComponentProps<typeof Ionicons>['name'];

/** Reporte de cocina o piso: retraso, falta de insumo, falla de equipo, devolución u otro. */
export function ReportIncidentScreen() {
  const { params } = useRoute<RouteProp<{ ReportIncident: ReportIncidentParams }, 'ReportIncident'>>();
  const navigation = useNavigation();
  const vm = useReportIncident(params?.orderId, () => navigation.goBack());

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.context}>
          {params?.place ? `Pedido de ${params.place}` : 'Incidencia general de cocina'}
        </Text>

        <Text style={styles.section}>¿Qué pasó?</Text>
        <View style={styles.types} accessibilityRole="radiogroup">
          {INCIDENT_TYPES.map((option) => {
            const selected = vm.type === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => vm.selectType(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                style={({ pressed }) => [styles.type, selected && styles.typeSelected, pressed && pressScale]}
              >
                <Ionicons
                  name={option.icon as IconName}
                  size={24}
                  color={selected ? colors.textOnBrand : colors.brandStrong}
                />
                <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {vm.type === 'retraso' && (
          <>
            <Text style={styles.section}>¿Cuánto más va a tardar?</Text>
            <View style={styles.chips} accessibilityRole="radiogroup">
              {DELAY_MINUTES.map((minutes) => (
                <Chip
                  key={minutes}
                  label={`${minutes} min`}
                  accessibilityLabel={`${minutes} minutos más`}
                  selected={vm.minutes === minutes}
                  onPress={() => vm.setMinutes(minutes)}
                />
              ))}
            </View>
          </>
        )}

        <TextField
          label={vm.type === 'otro' ? 'Describe qué pasó' : 'Detalle (opcional)'}
          accessibilityLabel="Detalle de la incidencia"
          value={vm.message}
          onChangeText={vm.setMessage}
          placeholder="Se acabó el aguacate, el horno no calienta…"
          multiline
          maxLength={300}
          style={styles.field}
        />

        {vm.errorMessage && <Notice message={vm.errorMessage} style={styles.notice} />}
        <Button label="Enviar reporte" onPress={vm.submit} loading={vm.isSending} style={styles.submit} />
        <Text style={styles.hint}>
          El personal de piso y el administrador lo ven al instante en sus pedidos.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const TYPE_SIZE = 96;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  context: { ...typography.bodyStrong, color: colors.textSecondary },
  section: {
    ...typography.overline,
    color: colors.brandStrong,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  type: {
    width: TYPE_SIZE,
    minHeight: TYPE_SIZE,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  typeSelected: { backgroundColor: colors.brandStrong, borderColor: colors.brandStrong },
  typeText: { ...typography.caption, color: colors.text, textAlign: 'center' },
  typeTextSelected: { color: colors.textOnBrand },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, minHeight: sizes.touchTarget },
  field: { marginTop: spacing.xl },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
  hint: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.sm },
});
