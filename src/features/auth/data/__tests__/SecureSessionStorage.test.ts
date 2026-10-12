import * as SecureStore from 'expo-secure-store';

import { makeSession } from '../../__fixtures__/auth';
import { SECURE_STORE_OPTIONS, SecureSessionStorage } from '../storage/SecureSessionStorage';

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const store = jest.mocked(SecureStore);

describe('SecureSessionStorage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('guarda la sesión en SecureStore solo para este dispositivo', async () => {
    const session = makeSession();
    await new SecureSessionStorage().save(session);

    expect(store.setItemAsync).toHaveBeenCalledWith(
      'auth.session',
      JSON.stringify(session),
      SECURE_STORE_OPTIONS,
    );
    expect(SECURE_STORE_OPTIONS.keychainAccessible).toBe('WHEN_UNLOCKED_THIS_DEVICE_ONLY');
  });

  it('lee la sesión guardada', async () => {
    const session = makeSession();
    store.getItemAsync.mockResolvedValue(JSON.stringify(session));

    await expect(new SecureSessionStorage().load()).resolves.toEqual(session);
  });

  it('devuelve null si no hay nada guardado', async () => {
    store.getItemAsync.mockResolvedValue(null);
    await expect(new SecureSessionStorage().load()).resolves.toBeNull();
  });

  it.each(['{no es json', '{"token":1}', 'null'])('descarta y borra un valor corrupto (%s)', async (raw) => {
    store.getItemAsync.mockResolvedValue(raw);

    await expect(new SecureSessionStorage().load()).resolves.toBeNull();
    expect(store.deleteItemAsync).toHaveBeenCalledWith('auth.session', SECURE_STORE_OPTIONS);
  });

  it('borra la sesión', async () => {
    await new SecureSessionStorage().clear();
    expect(store.deleteItemAsync).toHaveBeenCalledWith('auth.session', SECURE_STORE_OPTIONS);
  });
});
