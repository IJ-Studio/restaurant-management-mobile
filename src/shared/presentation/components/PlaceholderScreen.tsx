import { StyleSheet, Text, View } from 'react-native';

interface Props {
  title: string;
  description: string;
}

/** Pantalla provisional de una sección cuya historia aún no se implementa. */
export function PlaceholderScreen({ title, description }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#1f2933' },
  description: { fontSize: 14, color: '#52606d', marginTop: 8, textAlign: 'center' },
});
