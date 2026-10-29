import Ionicons from '@expo/vector-icons/Ionicons';
import { useState, type ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, sizes } from '../theme';
import { TextField } from './TextField';

type Props = Omit<ComponentProps<typeof TextField>, 'secureTextEntry' | 'right'>;

/** Campo de contraseña con botón para mostrarla u ocultarla (como `PasswordToggleButton` de la web). */
export function PasswordField(props: Props) {
  const [visible, setVisible] = useState(false);
  const name = props.accessibilityLabel ?? props.label;

  return (
    <TextField
      autoCapitalize="none"
      autoCorrect={false}
      {...props}
      secureTextEntry={!visible}
      right={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={visible ? `Ocultar ${name.toLowerCase()}` : `Mostrar ${name.toLowerCase()}`}
          hitSlop={4}
          style={styles.toggle}
        >
          <Ionicons
            name={visible ? 'eye-off-outline' : 'eye-outline'}
            size={22}
            color={colors.textSecondary}
          />
        </Pressable>
      }
    />
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: sizes.touchTarget,
    height: sizes.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
