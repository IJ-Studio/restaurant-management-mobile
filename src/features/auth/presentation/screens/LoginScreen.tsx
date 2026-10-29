import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { ScreenHeader } from '../../../../shared/presentation/components/ScreenHeader';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, radius, sizes, spacing } from '../../../../shared/presentation/theme';
import { useLogin } from '../viewmodels/useLogin';

const LOGO = require('../../../../../assets/brand/logo-el-quijote.png');
/** Proporción del archivo del logo (720 × 372). */
const LOGO_ASPECT_RATIO = 720 / 372;

export function LoginScreen() {
  const { email, setEmail, password, setPassword, fieldErrors, submit, isSubmitting, errorMessage } =
    useLogin();

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={LOGO}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="Restaurante El Quijote"
        />
        <View style={styles.divider} />

        <ScreenHeader
          title="Iniciar sesión"
          subtitle="Acceso exclusivo para el personal del restaurante"
          size="display"
          style={styles.header}
        />

        <TextField
          label="Correo"
          value={email}
          onChangeText={setEmail}
          placeholder="nombre@restaurante.mx"
          error={fieldErrors.email}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          editable={!isSubmitting}
        />
        <TextField
          label="Contraseña"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          error={fieldErrors.password}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          editable={!isSubmitting}
          onSubmitEditing={submit}
          style={styles.field}
        />

        {errorMessage && <Notice message={errorMessage} style={styles.notice} />}

        <Button label="Entrar" onPress={submit} loading={isSubmitting} style={styles.submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
  },
  logo: {
    width: sizes.logo,
    height: undefined,
    aspectRatio: LOGO_ASPECT_RATIO,
    alignSelf: 'center',
    tintColor: colors.text,
  },
  // Trazo naranja bajo el logo, como el subrayado de "Restaurante" en la marca.
  divider: {
    alignSelf: 'center',
    width: spacing.xxxl,
    height: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },
  header: { marginBottom: spacing.xl },
  field: { marginTop: spacing.lg },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
});
