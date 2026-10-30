import { useQueryClient } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors } from '../../../../shared/presentation/theme';
import { LoginScreen } from '../screens/LoginScreen';
import { useSession } from '../viewmodels/useSession';
import { useSessionBootstrap } from '../viewmodels/useSessionBootstrap';

/** Muestra el Login hasta que haya sesión; con sesión renderiza la app (HU-02: navegación por rol). */
export function AuthGate({ children }: { children: ReactNode }) {
  useSessionBootstrap();
  const status = useSession((state) => state.status);
  const queryClient = useQueryClient();

  // Al salir (logout o sesión vencida) no quedan en caché datos que vio el usuario anterior.
  useEffect(() => {
    if (status === 'unauthenticated') queryClient.clear();
  }, [status, queryClient]);

  if (status === 'restoring') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} accessibilityLabel="Cargando sesión" />
      </View>
    );
  }
  if (status === 'unauthenticated') return <LoginScreen />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
});
