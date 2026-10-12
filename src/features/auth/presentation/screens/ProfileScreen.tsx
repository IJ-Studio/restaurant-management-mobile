import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROLE_LABEL } from '../../domain/entities/User';
import { useSessionStore } from '../store/sessionStore';
import { useLogout } from '../viewmodels/useLogout';

/** Datos del usuario en sesión y cierre de sesión. Lo ven todos los roles. */
export function ProfileScreen() {
  const user = useSessionStore((state) => state.session?.user);
  const { logout, isLoading } = useLogout();
  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {user.name} {user.lastname}
      </Text>
      <Text style={styles.role}>{ROLE_LABEL[user.role]}</Text>
      <Text style={styles.email}>{user.email}</Text>
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
  email: { fontSize: 14, color: '#777' },
  button: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, borderWidth: 1, borderColor: '#1f6feb' },
  buttonText: { color: '#1f6feb', fontSize: 16, fontWeight: '600' },
});
