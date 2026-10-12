import { StatusBar } from 'expo-status-bar';
import { httpClient } from './src/core/http/httpClient';
import { initSentry, reportHttpError, Sentry } from './src/core/monitoring/sentry';
import { AppProviders } from './src/core/providers/AppProviders';
import { RootNavigator } from './src/navigation/RootNavigator';

initSentry();
httpClient.setErrorReporter(reportHttpError);

function App() {
  return (
    <AppProviders>
      <RootNavigator />
      <StatusBar style="auto" />
    </AppProviders>
  );
}

export default Sentry.wrap(App);
