import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LoginScreen } from '../features/auth/presentation/screens/LoginScreen';
import { useSessionStore } from '../features/auth/presentation/store/sessionStore';
import { useSessionBootstrap } from '../features/auth/presentation/viewmodels/useSessionBootstrap';
import { useCurrentOrderStore } from '../features/orders/presentation/store/currentOrderStore';
import { RoleTabs } from './RoleTabs';

/** Navegador raíz: cargando sesión, Login, o las tabs del rol leído del store de HU-01. */
export function RootNavigator() {
  const status = useSessionBootstrap();
  const role = useSessionStore((state) => state.session?.user.role);

  // Al cerrar sesión no quedan pedidos en curso de otro usuario en el dispositivo.
  useEffect(() => {
    if (status === 'unauthenticated') useCurrentOrderStore.getState().reset();
  }, [status]);

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Cargando sesión" />
      </View>
    );
  }
  if (status !== 'authenticated' || !role) return <LoginScreen />;

  return (
    <NavigationContainer>
      {/* `key`: si cambia el rol, se descarta el historial de navegación del rol anterior. */}
      <RoleTabs key={role} role={role} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
