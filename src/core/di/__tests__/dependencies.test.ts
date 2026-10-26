import * as SecureStore from 'expo-secure-store';

import { makeSession } from '../../../features/auth/__fixtures__/auth';
import { SESSION_EXPIRED_MESSAGE } from '../../errors/AppError';
import { httpClient } from '../../http/httpClient';
import { createDependencies } from '../dependencies';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

describe('createDependencies', () => {
  function unauthorizedHandler() {
    const spy = jest.spyOn(httpClient, 'setUnauthorizedHandler');
    const deps = createDependencies();
    const [handler] = spy.mock.calls[spy.mock.calls.length - 1];
    spy.mockRestore();
    return { deps, handler };
  }

  it('cuando el API rechaza el token cierra la sesión, avisa y borra la sesión guardada', () => {
    const { deps, handler } = unauthorizedHandler();
    deps.sessionStore.getState().setSession(makeSession());

    handler();

    expect(deps.sessionStore.getState()).toMatchObject({
      status: 'unauthenticated',
      session: null,
      notice: SESSION_EXPIRED_MESSAGE,
    });
    expect(SecureStore.deleteItemAsync).toHaveBeenCalled();
  });

  it('sin sesión activa no hace nada', () => {
    const { deps, handler } = unauthorizedHandler();
    deps.sessionStore.getState().clearSession();
    jest.mocked(SecureStore.deleteItemAsync).mockClear();

    handler();

    expect(deps.sessionStore.getState().notice).toBeNull();
    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  });
});
