import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { HeroCard } from '../../../../shared/presentation/components/HeroCard';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { colors, radius, spacing, typography } from '../../../../shared/presentation/theme';
import { formatTime } from '../../../../shared/utils/formatDateTime';
import { NotificationSettings } from '../../../notifications/presentation/components/NotificationSettings';
import type { Role } from '../../domain/entities/Role';
import { useLogout } from '../viewmodels/useLogout';
import { useSession } from '../viewmodels/useSession';

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  cajero: 'Cajero',
  mesero: 'Mesero',
  cocina: 'Cocina',
  cliente: 'Cliente',
};

/** Sello de la casa: círculo exterior de 80 con filete y anillo interior a 4 px. */
const SEAL_SIZE = 80;

function initials(name: string, lastname: string): string {
  return [name, lastname]
    .map((part) => part.trim().charAt(0))
    .join('')
    .toUpperCase();
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow} accessible accessibilityLabel={`${label}: ${value}`}>
      <Ionicons name={icon} size={16} color={colors.brand} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  label,
  onPress,
  external = false,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  /** Abre una página web: se anuncia como enlace y lleva el ícono de "abrir fuera". */
  external?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={external ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityHint={external ? 'Se abre en el navegador' : undefined}
      style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={18} color={colors.brand} />
      <Text style={styles.actionText}>{label}</Text>
      <Ionicons name={external ? 'open-outline' : 'chevron-forward'} size={14} color={colors.textMuted} />
    </Pressable>
  );
}

interface Props {
  /** Las da el navegador del perfil; sin ellas (p. ej. en pruebas) no se muestran las opciones. */
  onEditProfile?: () => void;
  onChangePassword?: () => void;
  /** Aviso de privacidad, preferencias y eliminar la cuenta. */
  onPrivacy?: () => void;
}

export function ProfileScreen({ onEditProfile, onChangePassword, onPrivacy }: Props = {}) {
  const user = useSession((state) => state.session?.user);
  const expiresAt = useSession((state) => state.session?.expiresAt);
  const { logout, isLoggingOut } = useLogout();
  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <HeroCard align="center" style={styles.hero}>
        <View style={styles.seal} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.sealRing}>
            <Text style={styles.sealText}>{initials(user.name, user.lastname)}</Text>
          </View>
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {user.name} {user.lastname}
        </Text>
        <StatusBadge label={ROLE_LABEL[user.role]} tone="brand" style={styles.role} />
      </HeroCard>

      <Card style={styles.info}>
        <InfoRow icon="mail-outline" label="Correo" value={user.email} />
        {expiresAt ? (
          <View style={styles.divider}>
            <InfoRow
              icon="time-outline"
              label="Tu sesión vence"
              value={`a las ${formatTime(new Date(expiresAt))}`}
            />
          </View>
        ) : null}
      </Card>

      {(onEditProfile || onChangePassword) && (
        <Card style={styles.info}>
          {onEditProfile && <ActionRow icon="create-outline" label="Editar perfil" onPress={onEditProfile} />}
          {onChangePassword && (
            <View style={onEditProfile ? styles.divider : undefined}>
              <ActionRow icon="key-outline" label="Cambiar contraseña" onPress={onChangePassword} />
            </View>
          )}
        </Card>
      )}

      <NotificationSettings />

      {onPrivacy && (
        <Card style={styles.info}>
          <ActionRow icon="shield-checkmark-outline" label="Privacidad" onPress={onPrivacy} />
        </Card>
      )}

      <Button
        label="Cerrar sesión"
        variant="outline"
        onPress={logout}
        loading={isLoggingOut}
        style={styles.logout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  hero: { alignItems: 'center', paddingVertical: spacing.xl },
  seal: {
    width: SEAL_SIZE,
    height: SEAL_SIZE,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.surface,
    padding: spacing.xs,
    marginBottom: spacing.lg,
  },
  sealRing: {
    flex: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sealText: { ...typography.title, color: colors.text },
  name: { ...typography.title, color: colors.text, textAlign: 'center' },
  role: { alignSelf: 'center', marginTop: spacing.sm },
  info: { marginTop: spacing.lg, paddingVertical: spacing.xs },
  // Contraetiqueta: rótulo en versalitas a la izquierda y valor tabular a la derecha.
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  infoLabel: { ...typography.overline, color: colors.textSecondary },
  infoValue: { ...typography.bodyStrong, color: colors.text, flex: 1, textAlign: 'right' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 48 },
  actionText: { ...typography.bodyStrong, color: colors.text, flex: 1 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.brandSoft },
  logout: { marginTop: spacing.xl },
});
