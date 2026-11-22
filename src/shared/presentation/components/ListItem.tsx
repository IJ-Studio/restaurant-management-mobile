import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, opacity, radius, sizes, spacing, typography } from '../theme';
import { StatusBadge, type StatusTone } from './StatusBadge';

interface Props {
  title: string;
  subtitle?: string;
  /** Texto a la derecha (p. ej. el precio). */
  trailing?: string;
  imageUrl?: string;
  /** Etiqueta corta junto al título (p. ej. "Agotado"). */
  badge?: string;
  badgeTone?: StatusTone;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
}

/** Fila de lista con imagen opcional, título, subtítulo, valor a la derecha y chevron si lleva a otra pantalla. */
export function ListItem({
  title,
  subtitle,
  trailing,
  imageUrl,
  badge,
  badgeTone = 'danger',
  disabled,
  onPress,
  testID,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      testID={testID}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={[title, badge, trailing].filter(Boolean).join(', ')}
      style={({ pressed }) => [styles.row, pressed && styles.pressed, disabled && styles.disabled]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]} />
      )}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
        {badge && <StatusBadge label={badge} tone={badgeTone} style={styles.badge} />}
      </View>
      {trailing && <Text style={styles.trailing}>{trailing}</Text>}
      {onPress && (
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={styles.chevron} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.brandSoft },
  disabled: { opacity: opacity.dimmed },
  image: {
    width: sizes.thumbnail,
    height: sizes.thumbnail,
    borderRadius: radius.sm,
    marginRight: spacing.md,
  },
  imagePlaceholder: { backgroundColor: colors.brandSoft, borderWidth: 1, borderColor: colors.border },
  body: { flex: 1 },
  title: { ...typography.subheading, color: colors.text },
  subtitle: { ...typography.small, color: colors.textSecondary, marginTop: spacing.xxs },
  badge: { marginTop: spacing.xs },
  trailing: { ...typography.price, color: colors.brandStrong, marginLeft: spacing.md },
  chevron: { marginLeft: spacing.sm },
});
