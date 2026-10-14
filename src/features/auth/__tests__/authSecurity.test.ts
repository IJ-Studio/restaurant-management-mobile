/**
 * Pruebas de seguridad de autenticación del lado de la app (#322, MASVS-AUTH / MASVS-STORAGE).
 * Las de fuerza bruta (429) y JWT alterado/expirado del lado servidor van en restaurant-management-api.
 */
import type { ErrorEvent } from '@sentry/react-native';
import * as SecureStore from 'expo-secure-store';

import { HttpClient } from '../../../core/http/httpClient';
import { scrubEvent } from '../../../core/monitoring/scrub';
import { AuthRemoteDataSource } from '../data/datasources/AuthRemoteDataSource';
import { AuthRepositoryImpl } from '../data/repositories/AuthRepositoryImpl';
import { SecureSessionStorage } from '../data/storage/SecureSessionStorage';
import { LoginUseCase } from '../domain/usecases/LoginUseCase';
import { RestoreSessionUseCase } from '../domain/usecases/RestoreSessionUseCase';

jest.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

const store = jest.mocked(SecureStore);
const TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJpZCI6IjciLCJleHAiOjE4MDAwMDAwMDB9.firma';

// Respuesta real de POST /auth/sign-in: el API manda la fila completa de users.
const signInResponse = {
  accessToken: TOKEN,
  user: {
    id: 7,
    name: 'Ana',
    lastname: 'López',
    email: 'ana@quijote.mx',
    phone: '5512345678',
    password: '$2b$10$hashDeLaContraseña',
    loginAttempts: 0,
    loginLockUntil: 0,
    roleId: 3,
  },
};

function makeLogin(fetchFn: jest.Mock) {
  const http = new HttpClient({
    baseUrl: 'https://api.test',
    timeoutMs: 1000,
    allowInsecure: false,
    fetchFn,
  });
  const storage = new SecureSessionStorage();
  return new LoginUseCase(new AuthRepositoryImpl(new AuthRemoteDataSource(http)), storage);
}

const respond = (status: number, body: unknown) =>
  jest.fn(async () => new Response(JSON.stringify(body), { status }));

describe('Seguridad de autenticación', () => {
  beforeEach(() => jest.clearAllMocks());

  it('guarda el token solo en SecureStore, sin hash de contraseña ni datos personales de más', async () => {
    await makeLogin(respond(200, signInResponse)).execute({ email: 'ana@quijote.mx', password: 'Pass#2026' });

    expect(store.setItemAsync).toHaveBeenCalledTimes(1);
    const [, saved, options] = store.setItemAsync.mock.calls[0];
    expect(options).toEqual({ keychainAccessible: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' });
    expect(saved).toContain(TOKEN);
    expect(saved).not.toContain('$2b$');
    expect(saved).not.toContain('password');
    expect(saved).not.toContain('5512345678');
    expect(saved).not.toContain('Pass#2026');
  });

  it('la app no usa AsyncStorage (almacenamiento sin cifrar)', () => {
    const { dependencies } = jest.requireActual<{ dependencies: Record<string, string> }>(
      '../../../../package.json',
    );
    expect(Object.keys(dependencies)).not.toContain('@react-native-async-storage/async-storage');
  });

  it.each([
    [400, { message: 'Correo inválido' }],
    [400, { message: 'Contraseña inválida' }],
    [401, { message: 'Unauthorized' }],
  ])('HTTP %i no revela si el usuario existe', async (status, body) => {
    const login = makeLogin(respond(status, body));

    await expect(login.execute({ email: 'x@quijote.mx', password: 'Pass#2026' })).rejects.toThrow(
      'Correo o contraseña incorrectos.',
    );
    expect(store.setItemAsync).not.toHaveBeenCalled();
  });

  it('con intentos repetidos (429) avisa y no guarda nada', async () => {
    const login = makeLogin(respond(429, { message: 'ThrottlerException: Too Many Requests' }));

    await expect(login.execute({ email: 'ana@quijote.mx', password: 'Pass#2026' })).rejects.toMatchObject({
      kind: 'rate-limit',
    });
    expect(store.setItemAsync).not.toHaveBeenCalled();
  });

  it('una cuenta de cliente no obtiene sesión en la app del personal', async () => {
    const login = makeLogin(respond(200, { ...signInResponse, user: { ...signInResponse.user, roleId: 5 } }));

    await expect(login.execute({ email: 'ana@quijote.mx', password: 'Pass#2026' })).rejects.toMatchObject({
      kind: 'forbidden',
    });
    expect(store.setItemAsync).not.toHaveBeenCalled();
  });

  it('una sesión con token expirado no se restaura y se borra del dispositivo', async () => {
    store.getItemAsync.mockResolvedValue(
      JSON.stringify({ token: TOKEN, expiresAt: 1000, user: { id: '7', role: 'mesero' } }),
    );

    await expect(
      new RestoreSessionUseCase(new SecureSessionStorage(), () => 2000).execute(),
    ).resolves.toBeNull();
    expect(store.deleteItemAsync).toHaveBeenCalled();
  });

  it('el token y las credenciales nunca llegan a Sentry', () => {
    const event = scrubEvent({
      message: `Fallo en auth/me con Bearer ${TOKEN}`,
      extra: { session: { token: TOKEN }, body: { email: 'ana@quijote.mx', password: 'Pass#2026' } },
      breadcrumbs: [{ message: `token=${TOKEN}`, data: { accessToken: TOKEN } }],
    } as unknown as ErrorEvent);

    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain(TOKEN);
    expect(serialized).not.toContain('Pass#2026');
    expect(serialized).not.toContain('ana@quijote.mx');
  });
});
