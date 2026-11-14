import { useEffect } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { Button } from '../../../../shared/presentation/components/Button';
import { colors, radius, spacing, typography } from '../../../../shared/presentation/theme';
import { useNotificationStore } from '../store/notificationStore';
import { useNotificationPermission } from '../viewmodels/useNotificationPermission';

/**
 * Explica para qué sirven las notificaciones antes de que aparezca el permiso del sistema, y solo
 * lo pide si la persona acepta. Con el permiso concedido, registra el teléfono para recibir avisos.
 */
export function NotificationPermissionPrompt() {
  const { deviceRegistrationUseCase } = useDependencies();
  const { canAsk, enabled, check, request } = useNotificationPermission();
  const dismissed = useNotificationStore((state) => state.rationaleDismissed);
  const dismiss = useNotificationStore((state) => state.dismissRationale);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    // Sin token (p. ej. sin servicios de Google) la app sigue funcionando, solo sin avisos.
    if (enabled) deviceRegistrationUseCase.register().catch(() => undefined);
  }, [enabled, deviceRegistrationUseCase]);

  return (
    <Modal visible={canAsk && !dismissed} transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            Avisos de pedidos
          </Text>
          <Text style={styles.text}>
            El Quijote te avisa cuando un pedido está listo para entregar o para cobrar, aunque tengas la app
            cerrada.
          </Text>
          <Text style={styles.text}>
            Para eso necesita tu permiso para mostrar notificaciones. Solo se usan para avisos del servicio y
            puedes apagarlos cuando quieras en Perfil → Privacidad.
          </Text>
          <Button label="Activar avisos" onPress={request} style={styles.accept} />
          <Button label="Ahora no" variant="ghost" onPress={dismiss} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.overlay },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md },
  title: { ...typography.title, color: colors.text },
  text: { ...typography.body, color: colors.textSecondary },
  accept: { marginTop: spacing.sm },
});
