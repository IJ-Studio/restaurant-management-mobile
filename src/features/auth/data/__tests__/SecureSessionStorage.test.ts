import * as SecureStore from 'expo-secure-store';

import type { Session } from '../../domain/entities/Session';
import { SecureSessionStorage } from '../storage/SessionStorage';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
    setItemAsync: jest.fn(async (key: string, value: string) => void store.set(key, value)),
    getItemAsync: jest.fn(async (key: string) => store.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => void store.delete(key)),
    __store: store,
  };
});

const session: Session = {
  token: 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjEifQ.firma',
  user: { id: '1', name: 'Ana', lastname: 'L', email: 'ana@resto.mx', role: 'cajero' },
};

describe('SecureSessionStorage', () => {
  const rawStore = (SecureStore as unknown as { __store: Map<string, string> }).__store;

  beforeEach(() => rawStore.clear());

  it('guarda y recupera la sesión en expo-secure-store', async () => {
    const storage = new SecureSessionStorage();
    await storage.save(session);
    await expect(storage.load()).resolves.toEqual(session);
  });

  it('solo accesible con el dispositivo desbloqueado y sin respaldo a otros dispositivos', async () => {
    await new SecureSessionStorage().save(session);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.objectContaining({ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY }),
    );
  });

  it('borra la sesión', async () => {
    const storage = new SecureSessionStorage();
    await storage.save(session);
    await storage.clear();
    await expect(storage.load()).resolves.toBeNull();
  });

  it.each(['no-es-json', '{}', '{"token":"t"}'])('ignora un valor corrupto (%p)', async (raw) => {
    rawStore.set('auth.session', raw);
    await expect(new SecureSessionStorage().load()).resolves.toBeNull();
  });

  it('el token nunca se escribe en AsyncStorage', () => {
    // La app no depende de AsyncStorage: si alguien lo agrega, esta prueba obliga a revisarlo.
    const pkg = require('../../../../../package.json');
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })).not.toContain(
      '@react-native-async-storage/async-storage',
    );
  });
});
