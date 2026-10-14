import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, spacing } from '../../../../shared/presentation/theme';
import type { ReservationChannel } from '../../domain/entities/Reservation';
import { DateTimeField } from '../components/DateTimeField';
import type { ReservationsStackParamList } from '../navigation/ReservationsNavigator';
import { useReservationForm } from '../viewmodels/useReservationForm';

type Props = NativeStackScreenProps<ReservationsStackParamList, 'NewReservation'>;

const CHANNELS: { value: ReservationChannel; label: string }[] = [
  { value: 'telefono', label: 'Por teléfono' },
  { value: 'presencial', label: 'En persona' },
];

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

export function NewReservationScreen({ navigation }: Props) {
  const { form, minimumDate, update, changePartySize, fieldErrors, submit, isSubmitting, errorMessage } =
    useReservationForm((result) => navigation.popTo('ReservationsList', { notice: result.message }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Field label="Nombre del cliente" error={fieldErrors.customerName}>
        <TextInput
          style={[styles.input, fieldErrors.customerName && styles.inputError]}
          value={form.customerName}
          onChangeText={(text) => update('customerName', text)}
          accessibilityLabel="Nombre del cliente"
          autoCapitalize="words"
        />
      </Field>
      <Field label="Teléfono" error={fieldErrors.customerPhone}>
        <TextInput
          style={[styles.input, fieldErrors.customerPhone && styles.inputError]}
          value={form.customerPhone}
          onChangeText={(text) => update('customerPhone', text)}
          accessibilityLabel="Teléfono"
          keyboardType="phone-pad"
        />
      </Field>
      <Field label="Correo" error={fieldErrors.customerEmail}>
        <TextInput
          style={[styles.input, fieldErrors.customerEmail && styles.inputError]}
          value={form.customerEmail}
          onChangeText={(text) => update('customerEmail', text)}
          accessibilityLabel="Correo"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Field>
      <Field label="Fecha y hora" error={fieldErrors.dateTime}>
        <DateTimeField
          value={form.dateTime}
          onChange={(date) => update('dateTime', date)}
          minimumDate={minimumDate}
          hasError={!!fieldErrors.dateTime}
        />
      </Field>
      <Field label="Personas" error={fieldErrors.partySize}>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepButton}
            onPress={() => changePartySize(-1)}
            accessibilityRole="button"
            accessibilityLabel="Menos personas"
          >
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.partySize} accessibilityLabel={`${form.partySize} personas`}>
            {form.partySize}
          </Text>
          <Pressable
            style={styles.stepButton}
            onPress={() => changePartySize(1)}
            accessibilityRole="button"
            accessibilityLabel="Más personas"
          >
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </Field>
      <Field label="Canal">
        <View style={styles.chips}>
          {CHANNELS.map((channel) => (
            <Pressable
              key={channel.value}
              style={[styles.chip, form.channel === channel.value && styles.chipSelected]}
              onPress={() => update('channel', channel.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: form.channel === channel.value }}
            >
              <Text style={form.channel === channel.value ? styles.chipTextSelected : styles.chipText}>
                {channel.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Field>
      <Field label="Ocasión (opcional)">
        <TextInput
          style={styles.input}
          value={form.occasion}
          onChangeText={(text) => update('occasion', text)}
          accessibilityLabel="Ocasión"
          placeholder="Cumpleaños, aniversario…"
        />
      </Field>
      <Field label="Peticiones especiales (opcional)" error={fieldErrors.specialRequests}>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={form.specialRequests}
          onChangeText={(text) => update('specialRequests', text)}
          accessibilityLabel="Peticiones especiales"
          multiline
          maxLength={500}
        />
      </Field>

      {errorMessage && (
        <Text style={styles.error} accessibilityRole="alert">
          {errorMessage}
        </Text>
      )}

      <Pressable
        style={[styles.submit, isSubmitting && styles.submitDisabled]}
        onPress={submit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Guardar reservación"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Guardar reservación</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  field: { marginBottom: spacing.lg },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputError: { borderColor: colors.danger },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  fieldError: { color: colors.danger, fontSize: 13, marginTop: spacing.xs },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, color: colors.primary },
  partySize: { fontSize: 20, fontWeight: '700', marginHorizontal: spacing.xl, color: colors.text },
  chips: { flexDirection: 'row' },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text },
  chipTextSelected: { color: '#fff', fontWeight: '600' },
  error: { color: colors.danger, textAlign: 'center', marginBottom: spacing.md },
  submit: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
