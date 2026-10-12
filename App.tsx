import { StatusBar } from 'expo-status-bar';
import { initSentry, Sentry } from './src/core/monitoring/sentry';
import { AppProviders } from './src/core/providers/AppProviders';
import { AuthGate } from './src/features/auth/presentation/screens/AuthGate';

initSentry();

function App() {
  return (
    <AppProviders>
      <AuthGate />
      <StatusBar style="auto" />
    </AppProviders>
  );
}

export default Sentry.wrap(App);
