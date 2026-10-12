import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { initSentry, Sentry } from './src/core/monitoring/sentry';
import { AppProviders } from './src/core/providers/AppProviders';

initSentry();

function App() {
  return (
    <AppProviders>
      <View style={styles.container}>
        <Text>Restaurant Management</Text>
        <StatusBar style="auto" />
      </View>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Sentry.wrap(App);
