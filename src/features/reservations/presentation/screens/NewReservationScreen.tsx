import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Chip } from '../../../../shared/presentation/components/Chip';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, radius, sizes, spacing, typography } from '../../../../shared/presentation/theme';
import type { ReservationChannel } from '../../domain/entities/Reservation';
import { DateTimeField } from '../components/DateTimeField';
import type { ReservationsStackParamList } from '../navigation/ReservationsNavigator';
import { useReservationForm } from '../viewmodels/useReservationForm';

type Props = NativeStackScreenProps<ReservationsStackParamList, 'NewReservation'>;

const CHANNELS: { value: ReservationChannel; label: string }[] = [
  { value: 'telefono', label: 'Por teléfono' },
  { value: 'presencial', label: 'En persona' },
];

/** Campo que no es de texto (fecha, personas, canal): etiqueta arriba y error abajo. */
function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error && <Text style={styles.fieldError}>{error}</Text>}
    </View>
  );
}

function StepButton({ symbol, label, onPress }: { symbol: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.stepButton, pressed && styles.stepPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.stepText}>{symbol}</Text>
    </Pressable>
  );
}

export function NewReservationScreen({ navigation }: Props) {
  const { form, minimumDate, update, changePartySize, fieldErrors, submit, isSubmitting, errorMessage } =
    useReservationForm((result) => navigation.popTo('ReservationsList', { notice: result.message }));

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.section}>Cliente</Text>
        <Card style={styles.card}>
          <TextField
            label="Nombre del cliente"
            value={form.customerName}
            onChangeText={(text) => update('customerName', text)}
            error={fieldErrors.customerName}
            autoCapitalize="words"
            textContentType="name"
          />
          <TextField
            label="Teléfono"
            value={form.customerPhone}
            onChangeText={(text) => update('customerPhone', text)}
            error={fieldErrors.customerPhone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            style={styles.spaced}
          />
          <TextField
            label="Correo"
            value={form.customerEmail}
            onChangeText={(text) => update('customerEmail', text)}
            error={fieldErrors.customerEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.spaced}
          />
        </Card>

        <Text style={styles.section}>Reservación</Text>
        <Card style={styles.card}>
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
              <StepButton symbol="−" label="Menos personas" onPress={() => changePartySize(-1)} />
              <Text style={styles.partySize} accessibilityLabel={`${form.partySize} personas`}>
                {form.partySize}
              </Text>
              <StepButton symbol="+" label="Más personas" onPress={() => changePartySize(1)} />
            </View>
          </Field>
          <Field label="Canal">
            <View style={styles.chips} accessibilityRole="radiogroup">
              {CHANNELS.map((channel) => (
                <Chip
                  key={channel.value}
                  label={channel.label}
                  selected={form.channel === channel.value}
                  onPress={() => update('channel', channel.value)}
                />
              ))}
            </View>
          </Field>
        </Card>

        <Text style={styles.section}>Detalles</Text>
        <Card style={styles.card}>
          <TextField
            label="Ocasión (opcional)"
            accessibilityLabel="Ocasión"
            value={form.occasion}
            onChangeText={(text) => update('occasion', text)}
            placeholder="Cumpleaños, aniversario…"
          />
          <TextField
            label="Peticiones especiales (opcional)"
            accessibilityLabel="Peticiones especiales"
            value={form.specialRequests}
            onChangeText={(text) => update('specialRequests', text)}
            error={fieldErrors.specialRequests}
            multiline
            maxLength={500}
            style={styles.spaced}
          />
        </Card>

        {errorMessage && <Notice message={errorMessage} style={styles.error} />}

        <Button label="Guardar reservación" onPress={submit} loading={isSubmitting} style={styles.submit} />
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
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  card: { paddingTop: spacing.md },
  spaced: { marginTop: spacing.lg },
  field: { marginBottom: spacing.lg },
  label: { ...typography.caption, color: colors.textSecondary, marginBottom: spacing.sm },
  fieldError: { ...typography.caption, color: colors.danger, marginTop: spacing.xs },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepButton: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPressed: { backgroundColor: colors.brandSoft },
  stepText: { ...typography.title, color: colors.brandStrong },
  partySize: {
    ...typography.title,
    color: colors.text,
    minWidth: sizes.control,
    textAlign: 'center',
    marginHorizontal: spacing.lg,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  error: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
});
