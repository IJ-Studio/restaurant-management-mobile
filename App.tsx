import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initSentry, Sentry } from './src/core/monitoring/sentry';
import { AppNavigator } from './src/core/navigation/AppNavigator';
import { AppProviders } from './src/core/providers/AppProviders';
import { AuthGate } from './src/features/auth/presentation/components/AuthGate';
import { appFonts } from './src/shared/presentation/theme/appFonts';

initSentry();

function App() {
  // Las fuentes vienen en el bundle y cargan casi al instante; si fallan, la app sigue con la del sistema.
  const [fontsLoaded, fontError] = useFonts(appFonts);
  if (!fontsLoaded && !fontError) return null;

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
