import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Chip } from '../../../../shared/presentation/components/Chip';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { mailtoUrl, whatsappUrl } from '../components/contact';
import { statusLabel, STATUS_OPTIONS } from '../components/reservationLabels';
import type { ReservationsStackParamList } from '../navigation/ReservationsNavigator';
import { useReservationStatus } from '../viewmodels/useReservationStatus';

type Props = NativeStackScreenProps<ReservationsStackParamList, 'ReservationStatus'>;

/** Cambiar el estado de una reservación (administrador), con los mismos pasos que la web. */
export function ReservationStatusScreen({ route, navigation }: Props) {
  const { id, customerName, status: current, summary, when, phone, email } = route.params;
  const greeting = `Hola, ${customerName}. Te escribimos de El Quijote por tu reserva del ${when ?? summary}.`;
  const whatsapp = whatsappUrl(phone, greeting);
  const mail = mailtoUrl(email, `Tu reserva en El Quijote del ${when ?? summary}`, `${greeting}\n\n`);
  const vm = useReservationStatus(id, current, (saved) =>
    navigation.navigate('ReservationsList', { notice: `Estado guardado: ${statusLabel(saved)}` }),
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title} accessibilityRole="header">
        Estado de {customerName}
      </Text>
      <Text style={styles.summary}>{summary}</Text>
      <View style={styles.contact}>
        <Button
          label={whatsapp ? 'WhatsApp' : 'Sin WhatsApp'}
          variant="outline"
          disabled={!whatsapp}
          onPress={() => whatsapp && void Linking.openURL(whatsapp)}
          accessibilityLabel={
            whatsapp
              ? `Escribir a ${customerName} por WhatsApp`
              : `Sin WhatsApp: no hay un teléfono válido de ${customerName}`
          }
        />
        <Button
          label={mail ? 'Correo' : 'Sin correo'}
          variant="outline"
          disabled={!mail}
          onPress={() => mail && void Linking.openURL(mail)}
          accessibilityLabel={
            mail
              ? `Escribir a ${customerName} por correo`
              : `Sin correo: no hay un correo válido de ${customerName}`
          }
        />
      </View>

      <Card style={styles.card}>
        <Text style={styles.label}>Estado</Text>
        <View style={styles.options} accessibilityRole="radiogroup">
          {STATUS_OPTIONS.map((option) => (
            <Chip
              key={option}
              label={statusLabel(option)}
              selected={vm.status === option}
              onPress={() => vm.select(option)}
            />
          ))}
        </View>
        {vm.cancelling && (
          <TextField
            label="Motivo de la cancelación"
            value={vm.reason}
            onChangeText={vm.setReason}
            error={vm.reasonError}
            maxLength={300}
            style={styles.reason}
          />
        )}
      </Card>

      {vm.error && <Notice message={vm.error} style={styles.notice} />}
      <Button
        label="Guardar estado"
        onPress={vm.submit}
        loading={vm.isSaving}
        disabled={vm.unchanged}
        style={styles.submit}
      />
      <Button label="Cancelar" variant="ghost" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contact: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  title: { ...typography.title, color: colors.text },
  summary: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  card: { marginTop: spacing.lg, gap: spacing.sm },
  label: { ...typography.bodyStrong, color: colors.text },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  reason: { marginTop: spacing.md },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
});
