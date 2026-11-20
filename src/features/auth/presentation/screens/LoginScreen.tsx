import { StatusBar } from 'expo-status-bar';
import { memo } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { DoubleRule } from '../../../../shared/presentation/components/DoubleRule';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { PasswordField } from '../../../../shared/presentation/components/PasswordField';
import { ScreenHeader } from '../../../../shared/presentation/components/ScreenHeader';
import { TextField } from '../../../../shared/presentation/components/TextField';
import { colors, sizes, spacing, typography } from '../../../../shared/presentation/theme';
import { useLogin } from '../viewmodels/useLogin';

const LOGO = require('../../../../../assets/brand/logo-el-quijote.png');
/** Proporción del archivo del logo (720 × 372). */
const LOGO_ASPECT_RATIO = 720 / 372;

// Partes fijas de la pantalla en memo: al escribir solo se vuelven a pintar los campos.
const Brand = memo(function Brand() {
  return (
    <View style={styles.hero}>
      <DoubleRule style={styles.rule} />
      <Image
        source={LOGO}
        style={styles.logo}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Restaurante El Quijote"
      />
      <Text style={styles.tagline}>Sabor con Alma</Text>
    </View>
  );
});

const Header = memo(function Header() {
  return (
    <ScreenHeader
      title="Iniciar sesión"
      subtitle="Acceso exclusivo para el personal del restaurante"
      size="display"
      style={styles.header}
    />
  );
});

export function LoginScreen() {
  const { email, setEmail, password, setPassword, fieldErrors, submit, isSubmitting, errorMessage } =
    useLogin();

  return (
    // Sin KeyboardAvoidingView (añade un render al montarse): en iOS el ScrollView ajusta su inserción al
    // teclado; en Android el sistema redimensiona la ventana, igual que antes.
    <View style={styles.screen}>
      {/* La cabecera del login es café claro: iconos oscuros. */}
      <StatusBar style="dark" />
      <ScrollView
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Brand />

        <View style={styles.sheet}>
          <Header />

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  // Banda de marca: superficie café sólida y filete doble, sin degradado ni marcas de agua.
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxxl + spacing.lg,
    paddingBottom: spacing.xxl,
    backgroundColor: colors.brandSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rule: { marginBottom: spacing.lg },
  logo: {
    width: sizes.logo,
    height: undefined,
    aspectRatio: LOGO_ASPECT_RATIO,
    tintColor: colors.text,
  },
  tagline: { ...typography.overline, color: colors.brand, marginTop: spacing.lg },
  sheet: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
  },
  header: { marginBottom: spacing.xl },
  field: { marginTop: spacing.lg + spacing.xs },
  notice: { marginTop: spacing.lg },
  submit: { marginTop: spacing.xl },
});
