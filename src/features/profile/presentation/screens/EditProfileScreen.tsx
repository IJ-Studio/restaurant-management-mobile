import { useNavigation } from '@react-navigation/native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import type { UserProfile } from '../../domain/entities/Profile';
import { useEditProfile, useProfileDetails } from '../viewmodels/useEditProfile';

export function EditProfileScreen() {
  const { profile, isLoading, loadError, retry } = useProfileDetails();

  if (isLoading) return <LoadingState message="Cargando tu perfil…" />;
  if (!profile) return <ErrorState message={loadError ?? 'No se pudo cargar tu perfil.'} onRetry={retry} />;
  return <EditProfileForm initial={profile} />;
}

/** El formulario se monta con los datos ya cargados: no hace falta sincronizarlos después. */
function EditProfileForm({ initial }: { initial: UserProfile }) {
  const navigation = useNavigation();
  const vm = useEditProfile(initial, () => navigation.goBack());

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <TextField
            label="Nombre"
            value={vm.form.name}
            onChangeText={(text) => vm.update('name', text)}
            error={vm.errors.name}
            autoCapitalize="words"
            textContentType="givenName"
            maxLength={50}
          />
          <TextField
            label="Apellido"
            value={vm.form.lastname}
            onChangeText={(text) => vm.update('lastname', text)}
            error={vm.errors.lastname}
            autoCapitalize="words"
            textContentType="familyName"
            maxLength={50}
            style={styles.spaced}
          />
          <TextField
            label="Teléfono"
            value={vm.form.phone}
            onChangeText={(text) => vm.update('phone', text)}
            error={vm.errors.phone}
            keyboardType="phone-pad"
            textContentType="telephoneNumber"
            placeholder="771 123 4567"
            style={styles.spaced}
          />
          <Text style={styles.hint}>Con 10 dígitos se agrega la lada de México (+52).</Text>
          <TextField label="Correo" value={vm.email} editable={false} style={styles.spaced} />
          <Text style={styles.hint}>El correo lo cambia el administrador.</Text>
        </Card>

        {vm.saveError && <Notice message={vm.saveError} style={styles.notice} />}
        <Button label="Guardar cambios" onPress={vm.submit} loading={vm.isSaving} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { paddingTop: spacing.md },
  spaced: { marginTop: spacing.lg },
  hint: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, marginLeft: spacing.xs },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
});
