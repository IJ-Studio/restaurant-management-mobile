import { Alert, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { legalLinks } from '../../../../core/config/legalLinks';
import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { PasswordField } from '../../../../shared/presentation/components/PasswordField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { useDeleteAccount } from '../viewmodels/useDeleteAccount';

/** Cancelación (ARCO): explica qué pasa, pide la contraseña y confirma antes de eliminar. */
export function DeleteAccountScreen() {
  const vm = useDeleteAccount();

  const askToConfirm = () => {
    if (!vm.validate()) return;
    Alert.alert('Eliminar mi cuenta', 'Tu cuenta se desactiva y tus datos se borran. No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, eliminar', style: 'destructive', onPress: vm.confirm },
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Text style={styles.heading}>Qué se borra</Text>
          <Text style={styles.text}>
            Tu nombre, correo, teléfono y contraseña, y el registro de este teléfono para los avisos. Ya no
            podrás entrar con esta cuenta.
          </Text>
          <Text style={styles.heading}>Qué se conserva</Text>
          <Text style={styles.text}>
            Los pedidos, cobros y registros de nómina que la ley obliga a guardar. Quedan sin tu nombre.
          </Text>
        </Card>

        <Card style={styles.card}>
          <PasswordField
            label="Tu contraseña"
            value={vm.password}
            onChangeText={vm.setPassword}
            error={vm.passwordError}
            textContentType="password"
            autoComplete="current-password"
          />
        </Card>

        {vm.error ? <Notice message={vm.error} style={styles.notice} /> : null}
        <Button
          label="Eliminar mi cuenta"
          variant="secondary"
          onPress={askToConfirm}
          loading={vm.isDeleting}
          style={styles.submit}
        />
        {/* Recurso web de eliminación que Google Play pide declarar en la ficha. */}
        <Button
          label="Pedir la eliminación desde la web"
          variant="ghost"
          onPress={() => {
            Linking.openURL(legalLinks.deleteAccount).catch(() => undefined);
          }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { marginBottom: spacing.lg, gap: spacing.sm },
  heading: { ...typography.bodyStrong, color: colors.text },
  text: { ...typography.body, color: colors.textSecondary },
  notice: { marginBottom: spacing.lg },
  submit: { marginTop: spacing.sm },
});
