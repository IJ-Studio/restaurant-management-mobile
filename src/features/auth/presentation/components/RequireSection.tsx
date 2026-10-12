import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { canAccess, type Section } from '../../domain/entities/permissions';
import { useSession } from '../viewmodels/useSession';

/** Segunda barrera además de no registrar la ruta: si el rol no tiene la sección, no se renderiza. */
export function RequireSection({ section, children }: { section: Section; children: ReactNode }) {
  const role = useSession((state) => state.session?.user.role);

  if (!canAccess(role, section)) {
    return (
      <View style={styles.container}>
        <Text style={styles.text} accessibilityRole="alert">
          No tienes acceso a esta sección.
        </Text>
      </View>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 16, color: '#d64545' },
});
