import { useEffect, type ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { errorReports } from '../../../../core/monitoring/errorReports';
import { colors } from '../../../../shared/presentation/theme';
import { useLogout } from '../../../auth/presentation/viewmodels/useLogout';
import { needsConsent } from '../../domain/entities/PrivacySettings';
import { PrivacyNoticeScreen } from '../screens/PrivacyNoticeScreen';
import { usePrivacySettings } from '../viewmodels/usePrivacySettings';

/**
 * Con sesión iniciada, muestra el aviso de privacidad hasta que la persona lo acepta (una vez por
 * versión del aviso). También aplica su preferencia de «Reportes de errores».
 */
export function PrivacyConsentGate({ children }: { children: ReactNode }) {
  const privacy = usePrivacySettings();
  const { logout } = useLogout();

  const reportsEnabled = privacy.settings?.errorReports;
  useEffect(() => {
    if (reportsEnabled === undefined) return undefined;
    errorReports.setEnabled(reportsEnabled);
    // La preferencia es de la persona: al salir vuelve al valor por defecto.
    return () => errorReports.setEnabled(true);
  }, [reportsEnabled]);

  if (privacy.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand} accessibilityLabel="Cargando privacidad" />
      </View>
    );
  }
  // Sin respuesta del API no se detiene el servicio del restaurante: se vuelve a pedir al abrir la app.
  if (privacy.loadFailed || !privacy.settings || !needsConsent(privacy.settings)) return <>{children}</>;

  return (
    <PrivacyNoticeScreen
      onAccept={privacy.acceptNotice}
      onDecline={logout}
      isAccepting={privacy.isAccepting}
      error={privacy.acceptError}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
});
