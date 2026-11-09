import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { legalLinks } from '../../../../core/config/legalLinks';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { HeroCard } from '../../../../shared/presentation/components/HeroCard';
import { colors, opacity, radius, spacing, typography } from '../../../../shared/presentation/theme';
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

const AVATAR_SIZE = 88;

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
      <Ionicons name={icon} size={20} color={colors.brandStrong} />
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
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
      style={({ pressed }) => [styles.infoRow, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.brandStrong} />
      <Text style={[styles.infoValue, styles.infoText]}>{label}</Text>
      <Ionicons name={external ? 'open-outline' : 'chevron-forward'} size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

/** Abre una página legal de la web. Si el teléfono no puede abrirla, no rompe la pantalla. */
function openLegalPage(url: string) {
  Linking.openURL(url).catch(() => undefined);
}

interface Props {
  /** Las da el navegador del perfil; sin ellas (p. ej. en pruebas) no se muestran las opciones. */
  onEditProfile?: () => void;
  onChangePassword?: () => void;
}

export function ProfileScreen({ onEditProfile, onChangePassword }: Props = {}) {
  const user = useSession((state) => state.session?.user);
  const expiresAt = useSession((state) => state.session?.expiresAt);
  const { logout, isLoggingOut } = useLogout();
  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <HeroCard align="center" style={styles.hero}>
        <View
          style={styles.avatar}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={styles.avatarText}>{initials(user.name, user.lastname)}</Text>
        </View>
        <Text style={styles.name} accessibilityRole="header">
          {user.name} {user.lastname}
        </Text>
        <Text style={styles.role}>{ROLE_LABEL[user.role]}</Text>
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

      <Card style={styles.info}>
        <ActionRow
          icon="shield-checkmark-outline"
          label="Aviso de privacidad"
          external
          onPress={() => openLegalPage(legalLinks.privacy)}
        />
        <View style={styles.divider}>
          <ActionRow
            icon="trash-outline"
            label="Eliminar cuenta"
            external
            onPress={() => openLegalPage(legalLinks.deleteAccount)}
          />
        </View>
      </Card>

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
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: radius.pill,
    backgroundColor: colors.onBrandSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: { ...typography.display, color: colors.textOnBrand },
  name: { ...typography.title, color: colors.textOnBrand, textAlign: 'center' },
  role: {
    ...typography.badge,
    color: colors.textOnBrand,
    backgroundColor: colors.onBrandSurface,
    borderRadius: radius.pill,
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
  },
  info: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  infoText: { flex: 1 },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: { ...typography.bodyStrong, color: colors.text },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { opacity: opacity.dimmed },
  logout: { marginTop: spacing.xl },
});
