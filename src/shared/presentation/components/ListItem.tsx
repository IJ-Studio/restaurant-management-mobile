import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '../theme';

interface Props {
  title: string;
  subtitle?: string;
  /** Texto a la derecha (p. ej. el precio). */
  trailing?: string;
  imageUrl?: string;
  /** Etiqueta corta junto al título (p. ej. "Agotado"). */
  badge?: string;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
}

/** Fila de lista con imagen opcional, título, subtítulo y valor a la derecha. */
export function ListItem({ title, subtitle, trailing, imageUrl, badge, disabled, onPress, testID }: Props) {
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
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {badge && <Text style={styles.badge}>{badge}</Text>}
        </View>
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      {trailing && <Text style={styles.trailing}>{trailing}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.background },
  disabled: { opacity: 0.5 },
  image: { width: 56, height: 56, borderRadius: 8, marginRight: spacing.md },
  imagePlaceholder: { backgroundColor: colors.border },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '600', color: colors.text, flexShrink: 1 },
  badge: {
    marginLeft: spacing.sm,
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    textTransform: 'uppercase',
  },
  subtitle: { fontSize: 13, color: colors.muted, marginTop: 2 },
  trailing: { fontSize: 15, fontWeight: '600', color: colors.text, marginLeft: spacing.md },
});
