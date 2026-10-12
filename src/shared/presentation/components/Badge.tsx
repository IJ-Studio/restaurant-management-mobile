import { StyleSheet, Text } from 'react-native';

type Tone = 'neutral' | 'danger' | 'success';

/** Etiqueta corta: "Agotado", "Vegano", "Nuevo"... */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  return <Text style={[styles.badge, styles[tone]]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  neutral: { backgroundColor: '#eef1f4', color: '#333' },
  danger: { backgroundColor: '#fde7e9', color: '#b00020' },
  success: { backgroundColor: '#e6f4ea', color: '#1e7e34' },
});
