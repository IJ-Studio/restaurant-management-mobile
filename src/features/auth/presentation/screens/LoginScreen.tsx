import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useLogin } from '../viewmodels/useLogin';

export function LoginScreen() {
  const { email, setEmail, password, setPassword, fieldErrors, submit, isSubmitting, errorMessage } =
    useLogin();

  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        Iniciar sesión
      </Text>
      <Text style={styles.subtitle}>Acceso exclusivo para el personal del restaurante</Text>

      <Text style={styles.label}>Correo</Text>
      <TextInput
        style={[styles.input, fieldErrors.email && styles.inputError]}
        value={email}
        onChangeText={setEmail}
        placeholder="nombre@restaurante.mx"
        accessibilityLabel="Correo"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        keyboardType="email-address"
        textContentType="username"
        editable={!isSubmitting}
      />
      {fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

      <Text style={styles.label}>Contraseña</Text>
      <TextInput
        style={[styles.input, fieldErrors.password && styles.inputError]}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        accessibilityLabel="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="password"
        textContentType="password"
        editable={!isSubmitting}
        onSubmitEditing={submit}
      />
      {fieldErrors.password && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}

      {errorMessage && (
        <Text style={styles.error} accessibilityRole="alert">
          {errorMessage}
        </Text>
      )}

      <Pressable
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={submit}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#1f2933' },
  subtitle: { fontSize: 14, color: '#52606d', marginTop: 4, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: '#1f2933', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd2d9',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 4,
  },
  inputError: { borderColor: '#d64545' },
  fieldError: { color: '#d64545', fontSize: 13, marginBottom: 12 },
  error: { color: '#d64545', fontSize: 14, marginVertical: 12, textAlign: 'center' },
  button: {
    backgroundColor: '#b44d12',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
