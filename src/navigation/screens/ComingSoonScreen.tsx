import { StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  story: string;
}

/** Lugar de una sección que llega en una historia posterior. */
export function ComingSoonScreen({ title, story }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.note}>Disponible con {story}.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  note: { fontSize: 14, color: '#777' },
});
