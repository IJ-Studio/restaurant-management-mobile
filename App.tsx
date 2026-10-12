import { StatusBar } from 'expo-status-bar';
import { initSentry, Sentry } from './src/core/monitoring/sentry';
import { AppProviders } from './src/core/providers/AppProviders';
import { AuthGate } from './src/features/auth/presentation/components/AuthGate';
import { WelcomeScreen } from './src/features/auth/presentation/screens/WelcomeScreen';

initSentry();

function App() {
  return (
    <AppProviders>
      <StatusBar style="auto" />
      <AuthGate>
        <WelcomeScreen />
      </AuthGate>
    </AppProviders>
  );
}

export default Sentry.wrap(App);
