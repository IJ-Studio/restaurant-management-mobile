import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';

import { LoginScreen } from '../features/auth/presentation/screens/LoginScreen';
import { makeWrapper } from '../core/testing/perf';

describe('Rendimiento: Login', () => {
  it('render inicial y captura de credenciales', async () => {
    // Arrange
    const scenario = async () => {
      await fireEvent.changeText(screen.getByLabelText('Correo'), 'mesero@pruebas.quijote.mx');
      await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Prueba#2026');
    };

    // Act / Assert: Reassure guarda tiempo y número de renders en .reassure/current.perf
    await measureRenders(<LoginScreen />, { wrapper: makeWrapper(), scenario });
  });
});
