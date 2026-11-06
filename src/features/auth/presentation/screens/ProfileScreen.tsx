import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NotificationSettings } from '../../../notifications/presentation/components/NotificationSettings';
import type { Role } from '../../domain/entities/Role';
import { useLogout } from '../viewmodels/useLogout';
import { useSession } from '../viewmodels/useSession';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  cajero: 'Cajero',
  mesero: 'Mesero',
  cocina: 'Cocina',
  cliente: 'Cliente',
};

export function ProfileScreen() {
  const user = useSession((state) => state.session?.user);
  const { logout, isLoggingOut } = useLogout();
  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {user.name} {user.lastname}
      </Text>
      <Text style={styles.role}>{ROLE_LABEL[user.role]}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <NotificationSettings />
      <Pressable style={styles.button} onPress={logout} disabled={isLoggingOut} accessibilityRole="button">
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1f2933' },
  role: { fontSize: 16, color: '#b44d12', fontWeight: '600', marginTop: 4 },
  email: { fontSize: 14, color: '#52606d', marginTop: 4, marginBottom: 32 },
  button: {
    borderWidth: 1,
    borderColor: '#b44d12',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: '#b44d12', fontSize: 16, fontWeight: '600' },
});
