import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../theme';
import { ScreenHeader } from './ScreenHeader';

interface Props {
  title: string;
  description: string;
}

/** Pantalla provisional de una sección cuya historia aún no se implementa. */
export function PlaceholderScreen({ title, description }: Props) {
  return (
    <View style={styles.container}>
      <ScreenHeader eyebrow="Próximamente" title={title} subtitle={description} align="center" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
});
