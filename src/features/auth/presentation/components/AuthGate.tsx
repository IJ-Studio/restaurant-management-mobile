import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { LoginScreen } from '../screens/LoginScreen';
import { useSession } from '../viewmodels/useSession';
import { useSessionBootstrap } from '../viewmodels/useSessionBootstrap';

/** Muestra el Login hasta que haya sesión; con sesión renderiza la app (HU-02: navegación por rol). */
export function AuthGate({ children }: { children: ReactNode }) {
  useSessionBootstrap();
  const status = useSession((state) => state.status);

  if (status === 'restoring') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" accessibilityLabel="Cargando sesión" />
      </View>
    );
  }
  if (status === 'unauthenticated') return <LoginScreen />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
