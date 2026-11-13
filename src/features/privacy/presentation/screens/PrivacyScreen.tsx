import { Linking, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { legalLinks } from '../../../../core/config/legalLinks';
import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { LoadingState } from '../../../../shared/presentation/components/LoadingState';
import { Notice } from '../../../../shared/presentation/components/Notice';
import { SectionTitle } from '../../../../shared/presentation/components/SectionTitle';
import { colors, spacing, typography } from '../../../../shared/presentation/theme';
import { formatDate } from '../../../../shared/utils/formatDateTime';
import type { PrivacyPreference } from '../../domain/entities/PrivacySettings';
import { usePrivacySettings } from '../viewmodels/usePrivacySettings';

const PREFERENCES: { key: PrivacyPreference; label: string; hint: string }[] = [
  {
    key: 'pushNotifications',
    label: 'Avisos de pedidos',
    hint: 'Notificaciones cuando un pedido cambia de estado.',
  },
  {
    key: 'errorReports',
    label: 'Reportes de errores',
    hint: 'Informes técnicos, sin tu nombre ni tu correo, cuando la app falla.',
  },
];

/** Dónde se ejerce cada derecho ARCO dentro de la app. */
const RIGHTS = [
  ['Acceso', 'Tus datos están en Perfil.'],
  ['Rectificación', 'Corrígelos en Perfil → Editar perfil.'],
  ['Cancelación', 'Elimina tu cuenta desde esta pantalla.'],
  ['Oposición', 'Apaga aquí los avisos o los reportes de errores.'],
] as const;

interface Props {
  onDeleteAccount: () => void;
}

/** Privacidad de la cuenta: aviso aceptado, preferencias de exclusión y eliminación de la cuenta. */
export function PrivacyScreen({ onDeleteAccount }: Props) {
  const vm = usePrivacySettings();

  if (vm.isLoading) return <LoadingState message="Cargando tu privacidad" />;
  if (!vm.settings) {
    return <ErrorState message="No se pudo cargar tu privacidad." onRetry={vm.retry} />;
  }
  const { noticeAcceptedAt, noticeVersion } = vm.settings;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SectionTitle title="Aviso de privacidad" />
      <Card style={styles.card}>
        <Text style={styles.text}>
          {noticeAcceptedAt
            ? `Lo aceptaste el ${formatDate(noticeAcceptedAt)} (versión ${noticeVersion ?? ''}).`
            : 'Todavía no lo has aceptado.'}
        </Text>
        <Button
          label="Leer el aviso de privacidad completo"
          variant="ghost"
          onPress={() => {
            Linking.openURL(legalLinks.privacy).catch(() => undefined);
          }}
        />
      </Card>

      <SectionTitle title="Tus preferencias" />
      <Card style={styles.card}>
        {PREFERENCES.map(({ key, label, hint }, index) => (
          <View key={key} style={[styles.row, index > 0 && styles.divider]}>
            <View style={styles.rowText}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.hint}>{hint}</Text>
            </View>
            <Switch
              value={vm.isOn(key)}
              onValueChange={(enabled) => vm.setPreference(key, enabled)}
              disabled={vm.isSaving}
              accessibilityLabel={label}
              accessibilityHint={hint}
              trackColor={{ true: colors.brand, false: colors.border }}
            />
          </View>
        ))}
      </Card>
      {vm.saveError ? <Notice message={vm.saveError} style={styles.notice} /> : null}

      <SectionTitle title="Tus derechos" />
      <Card style={styles.card}>
        {RIGHTS.map(([right, where]) => (
          <Text key={right} style={styles.text}>
            <Text style={styles.label}>{right}: </Text>
            {where}
          </Text>
        ))}
      </Card>

      <Button label="Eliminar mi cuenta" variant="outline" onPress={onDeleteAccount} style={styles.delete} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rowText: { flex: 1 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  label: { ...typography.bodyStrong, color: colors.text },
  hint: { ...typography.caption, color: colors.textSecondary },
  text: { ...typography.body, color: colors.text },
  notice: { marginTop: spacing.md },
  delete: { marginTop: spacing.xl },
});
