import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../../shared/presentation/components/Button';
import { Card } from '../../../../shared/presentation/components/Card';
import { StatusBadge } from '../../../../shared/presentation/components/StatusBadge';
import { colors, radius, spacing, typography } from '../../../../shared/presentation/theme';
import { formatTime } from '../../../../shared/utils/formatDateTime';
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

export function ProfileScreen() {
  const user = useSession((state) => state.session?.user);
  const expiresAt = useSession((state) => state.session?.expiresAt);
  const { logout, isLoggingOut } = useLogout();
  if (!user) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card elevation="raised" style={styles.hero}>
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
        <StatusBadge label={ROLE_LABEL[user.role]} tone="brand" style={styles.role} />
      </Card>

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
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  avatarText: { ...typography.display, color: colors.brandStrong },
  name: { ...typography.title, color: colors.text, textAlign: 'center' },
  role: { alignSelf: 'center', marginTop: spacing.sm },
  info: { marginTop: spacing.lg, paddingVertical: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  infoText: { flex: 1 },
  infoLabel: { ...typography.caption, color: colors.textSecondary },
  infoValue: { ...typography.bodyStrong, color: colors.text },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  logout: { marginTop: spacing.xl },
});
