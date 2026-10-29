import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { PasswordField } from '../../../../shared/presentation/components/PasswordField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { useChangePassword } from '../viewmodels/useChangePassword';

export function ChangePasswordScreen() {
  const navigation = useNavigation();
  const vm = useChangePassword();

  if (vm.done) {
    return (
      <View style={styles.done}>
        <Notice tone="success" message="Tu contraseña se cambió. Úsala la próxima vez que inicies sesión." />
        <Button label="Volver al perfil" onPress={() => navigation.goBack()} style={styles.submit} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <PasswordField
            label="Contraseña actual"
            value={vm.form.current}
            onChangeText={(text) => vm.update('current', text)}
            error={vm.errors.current}
            textContentType="password"
            autoComplete="current-password"
          />
          <PasswordField
            label="Contraseña nueva"
            value={vm.form.next}
            onChangeText={(text) => vm.update('next', text)}
            error={vm.errors.next}
            textContentType="newPassword"
            autoComplete="new-password"
            style={styles.spaced}
          />
          <View style={styles.rules} accessibilityLabel="Requisitos de la contraseña">
            {vm.rules.map((rule) => (
              <View
                key={rule.label}
                style={styles.rule}
                accessible
                accessibilityLabel={`${rule.label}: ${rule.met ? 'cumple' : 'falta'}`}
              >
                <Ionicons
                  name={rule.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={16}
                  color={rule.met ? colors.success : colors.textMuted}
                />
                <Text style={[styles.ruleText, rule.met && styles.ruleMet]}>{rule.label}</Text>
              </View>
            ))}
          </View>
          <PasswordField
            label="Confirma la contraseña nueva"
            accessibilityLabel="Confirmar contraseña"
            value={vm.form.confirm}
            onChangeText={(text) => vm.update('confirm', text)}
            error={vm.errors.confirm}
            textContentType="newPassword"
            style={styles.spaced}
          />
        </Card>

        {vm.saveError && <Notice message={vm.saveError} style={styles.notice} />}
        <Button label="Cambiar contraseña" onPress={vm.submit} loading={vm.isSaving} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { paddingTop: spacing.md },
  spaced: { marginTop: spacing.lg },
  rules: { marginTop: spacing.md, gap: spacing.xs },
  rule: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  ruleText: { ...typography.caption, color: colors.textSecondary },
  ruleMet: { color: colors.success },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
  done: { flex: 1, padding: spacing.xl, justifyContent: 'center', backgroundColor: colors.background },
});
