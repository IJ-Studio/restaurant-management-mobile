import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSessionStore } from '../store/sessionStore';
import { useLogout } from '../viewmodels/useLogout';

const ROLE_LABEL = { admin: 'Administrador', cajero: 'Cajero', mesero: 'Mesero', cocina: 'Cocina' } as const;

/** Pantalla temporal tras el login. HU-02 la reemplaza por la navegación según el rol. */
export function SignedInScreen() {
  const user = useSessionStore((state) => state.session?.user);
  const { logout, isLoading } = useLogout();
  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hola, {user.name}</Text>
      <Text style={styles.role}>{ROLE_LABEL[user.role]}</Text>
      <Pressable style={styles.button} onPress={logout} disabled={isLoading} accessibilityRole="button">
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  role: { fontSize: 16, color: '#555' },
  button: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#1f6feb' },
  buttonText: { color: '#1f6feb', fontSize: 16, fontWeight: '600' },
});
