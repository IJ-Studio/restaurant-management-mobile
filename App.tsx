import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initSentry, Sentry } from './src/core/monitoring/sentry';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { AppProviders } from './src/core/providers/AppProviders';
import { AuthGate } from './src/features/auth/presentation/components/AuthGate';

initSentry();

function App() {
  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar style="auto" />
        <AuthGate>
          <AppNavigator />
        </AuthGate>
      </AppProviders>
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
