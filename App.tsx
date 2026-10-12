import { StatusBar } from 'expo-status-bar';
import { initSentry, Sentry } from './src/core/monitoring/sentry';
import { AppProviders } from './src/core/providers/AppProviders';
import { RootNavigator } from './src/navigation/RootNavigator';

initSentry();

function App() {
  return (
    <AppProviders>
      <RootNavigator />
      <StatusBar style="auto" />
    </AppProviders>
  );
}

export default Sentry.wrap(App);
