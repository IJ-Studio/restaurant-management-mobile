import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import type { ReservationField } from '../../domain/entities/reservationRules';
import type { ReservationsStackParamList } from '../navigation/ReservationsStack';
import { useReservationForm } from '../viewmodels/useReservationForm';

type Props = NativeStackScreenProps<ReservationsStackParamList, 'ReservationForm'>;

export function ReservationFormScreen({ navigation }: Props) {
  const { draft, errors, setField, submit, isSubmitting, submitError } = useReservationForm(() => navigation.goBack());

  const field = (name: ReservationField, label: string, props: TextInputProps = {}) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[name] && styles.inputError]}
        value={draft[name]}
        onChangeText={(value) => setField(name, value)}
        accessibilityLabel={label}
        editable={!isSubmitting}
        {...props}
      />
      {errors[name] ? <Text style={styles.error}>{errors[name]}</Text> : null}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {field('customerName', 'Nombre del comensal', { autoCapitalize: 'words' })}
      {field('customerPhone', 'Teléfono', { keyboardType: 'phone-pad' })}
      {field('customerEmail', 'Correo', { keyboardType: 'email-address', autoCapitalize: 'none', autoCorrect: false })}
      <View style={styles.row}>
        <View style={styles.flex}>{field('date', 'Fecha', { placeholder: 'AAAA-MM-DD' })}</View>
        <View style={styles.flex}>{field('time', 'Hora', { placeholder: 'HH:MM' })}</View>
      </View>
      {field('partySize', 'Personas', { keyboardType: 'number-pad' })}
      {field('notes', 'Notas (opcional)', { multiline: true, maxLength: 500 })}

      {submitError ? (
        <Text style={styles.error} accessibilityRole="alert">
          {submitError}
        </Text>
      ) : null}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonBusy]}
        onPress={submit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" accessibilityLabel="Guardando reservación" />
        ) : (
          <Text style={styles.buttonText}>Guardar reservación</Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#111' },
  inputError: { borderColor: '#b00020' },
  error: { color: '#b00020', fontSize: 13 },
  button: { marginTop: 8, backgroundColor: '#1f6feb', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  buttonBusy: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
