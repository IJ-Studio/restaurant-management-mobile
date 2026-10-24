import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useNotificationPermission } from '../viewmodels/useNotificationPermission';

/** Estado del permiso de notificaciones y cómo activarlo. Se muestra en Perfil. */
export function NotificationSettings() {
  const { enabled, needsSettings, request, openSettings } = useNotificationPermission();

  return (
    <View style={styles.container}>
      <Text style={styles.status}>Notificaciones: {enabled ? 'activadas' : 'desactivadas'}</Text>
      {enabled ? null : (
        <>
          <Text style={styles.hint}>Actívalas para enterarte cuando un pedido cambie de estado.</Text>
          <Pressable
            style={styles.button}
            onPress={needsSettings ? openSettings : request}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{needsSettings ? 'Abrir Ajustes' : 'Activar notificaciones'}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6, marginTop: 16 },
  status: { fontSize: 14, fontWeight: '600', color: '#333' },
  hint: { fontSize: 13, color: '#777', textAlign: 'center', paddingHorizontal: 24 },
  button: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#eef1f4' },
  buttonText: { color: '#1f6feb', fontWeight: '600' },
});
