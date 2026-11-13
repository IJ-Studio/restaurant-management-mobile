/**
 * Integración: renovación de la sesión con datos de prueba. Recorre httpClient → refresco →
 * RefreshSessionUseCase → almacenamiento seguro → sesión, contra el API falso.
 */
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { testUsers } from '../../core/testing/data/testData';
import { loginAs, startTestApp, tab } from '../../core/testing/startTestApp';

describe('Integración: renovación de la sesión', () => {
  it('si el servidor se reinicia, la app renueva la sesión sola y el mesero sigue trabajando', async () => {
    const { api, storage } = await startTestApp();
    await loginAs(testUsers.mesero.email);
    await waitFor(() => expect(tab('Reservaciones')).toBeOnTheScreen());
    const before = storage.saved();

    api.expireAccessTokens();
    await fireEvent.press(tab('Reservaciones')!);

    // La pantalla carga con datos del API: no hubo que volver a iniciar sesión.
    await waitFor(() => expect(api.requests.some((r) => r.path === 'auth/refresh')).toBe(true));
    await waitFor(() => expect(storage.saved()?.token).not.toBe(before?.token));
    expect(storage.saved()?.refreshToken).not.toBe(before?.refreshToken);
    expect(screen.queryByText('Tu sesión expiró. Vuelve a iniciar sesión.')).toBeNull();
    expect(tab('Reservaciones')).toBeOnTheScreen();

    // El refresco viaja sin el token vencido.
    const refresh = api.requests.find((r) => r.path === 'auth/refresh');
    expect(refresh).toMatchObject({ method: 'POST', authorization: null });
  });

  it('si el refresco ya no sirve, vuelve al Login con el aviso y borra la sesión guardada', async () => {
    const { api, storage } = await startTestApp();
    await loginAs(testUsers.mesero.email);
    await waitFor(() => expect(tab('Reservaciones')).toBeOnTheScreen());

    api.expireAccessTokens();
    api.revokeRefreshTokens();
    await fireEvent.press(tab('Reservaciones')!);

    expect(await screen.findByText('Tu sesión expiró. Vuelve a iniciar sesión.')).toBeOnTheScreen();
    await waitFor(() => expect(storage.saved()).toBeNull());
  });
});
