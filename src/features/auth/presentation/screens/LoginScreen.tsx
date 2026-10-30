import { LinearGradient } from 'expo-linear-gradient';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { PasswordField } from '../../../../shared/presentation/components/PasswordField';
import { ScreenHeader } from '../../../../shared/presentation/components/ScreenHeader';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, gradients, radius, sizes, spacing, typography } from '../../../../shared/presentation/theme';
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
        bounces={false}
      >
        <LinearGradient
          colors={gradients.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View
            style={styles.ring}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
          <Image
            source={LOGO}
            style={styles.logo}
            resizeMode="contain"
            accessibilityRole="image"
            accessibilityLabel="Restaurante El Quijote"
          />
          <Text style={styles.tagline}>Sabor con Alma</Text>
        </LinearGradient>

        <View style={styles.sheet}>
          <ScreenHeader
            title="Iniciar sesión"
            subtitle="Acceso exclusivo para el personal del restaurante"
            size="title"
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
          <PasswordField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            error={fieldErrors.password}
            autoComplete="password"
            textContentType="password"
            returnKeyType="go"
            editable={!isSubmitting}
            onSubmitEditing={submit}
            style={styles.field}
          />

          {errorMessage && <Notice message={errorMessage} style={styles.notice} />}

          <Button label="Entrar" onPress={submit} loading={isSubmitting} style={styles.submit} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const RING = 280;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: { flexGrow: 1 },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl + spacing.xxl,
    paddingBottom: spacing.xxxl + spacing.xl,
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    borderWidth: spacing.xxxl,
    borderColor: colors.onBrandDecor,
    right: -RING / 3,
    top: -RING / 4,
  },
  logo: {
    width: sizes.logo,
    height: undefined,
    aspectRatio: LOGO_ASPECT_RATIO,
    tintColor: colors.textOnBrand,
  },
  tagline: { ...typography.overline, color: colors.textOnBrandMuted, marginTop: spacing.lg },
  // La hoja blanca se monta sobre el degradado, como una tarjeta que sube desde abajo.
  sheet: {
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  header: { marginBottom: spacing.xl },
  field: { marginTop: spacing.lg },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
});
