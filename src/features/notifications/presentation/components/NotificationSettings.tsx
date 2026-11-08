import { StyleSheet, Text } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { useNotificationPermission } from '../viewmodels/useNotificationPermission';

/** Estado del permiso de notificaciones y cómo activarlo. Se muestra en Perfil. */
export function NotificationSettings() {
  const { enabled, needsSettings, request, openSettings } = useNotificationPermission();

  return (
    <Card style={styles.container}>
      <Text style={styles.status}>Notificaciones: {enabled ? 'activadas' : 'desactivadas'}</Text>
      {enabled ? null : (
        <>
          <Text style={styles.hint}>Actívalas para enterarte cuando un pedido cambie de estado.</Text>
          <Button
            label={needsSettings ? 'Abrir Ajustes' : 'Activar notificaciones'}
            variant="outline"
            onPress={needsSettings ? openSettings : request}
          />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm, marginTop: spacing.lg },
  status: { ...typography.bodyStrong, color: colors.text },
  hint: { ...typography.caption, color: colors.textSecondary },
});
