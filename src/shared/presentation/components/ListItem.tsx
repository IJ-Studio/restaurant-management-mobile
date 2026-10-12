import type { ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from './Card';

interface Props {
  title: string;
  subtitle?: string;
  /** Texto a la derecha (precio, hora, total). */
  trailing?: string;
  imageUrl?: string | null;
  /** Etiquetas debajo del subtítulo (p. ej. "Agotado"). */
  badges?: ReactNode;
  dimmed?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}

/** Renglón de lista reutilizable: imagen opcional, título, subtítulo y dato a la derecha. */
export function ListItem({ title, subtitle, trailing, imageUrl, badges, dimmed, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={[styles.row, dimmed && styles.dimmed]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} accessibilityIgnoresInvertColors />
        ) : null}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          {badges}
        </View>
        {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dimmed: { opacity: 0.55 },
  pressed: { opacity: 0.7 },
  image: { width: 64, height: 64, borderRadius: 8, backgroundColor: '#eee' },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 16, fontWeight: '600', color: '#111' },
  subtitle: { fontSize: 13, color: '#555' },
  trailing: { fontSize: 16, fontWeight: '600', color: '#111' },
});
