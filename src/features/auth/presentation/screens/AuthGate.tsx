import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useSessionBootstrap } from '../viewmodels/useSessionBootstrap';
import { LoginScreen } from './LoginScreen';
import { SignedInScreen } from './SignedInScreen';

/** Decide qué mostrar según la sesión: cargando, Login o la app. */
export function AuthGate() {
  const status = useSessionBootstrap();

  if (status === 'checking') {
    return (
      <View style={styles.center}>
        <ActivityIndicator accessibilityLabel="Cargando sesión" />
      </View>
    );
  }
  return status === 'authenticated' ? <SignedInScreen /> : <LoginScreen />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
