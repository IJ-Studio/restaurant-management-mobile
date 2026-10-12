import { jwtExpiration, toSession } from '../mappers/sessionMapper';
import type { SignInResponseDto } from '../dtos/SignInResponseDto';

function jwt(payload: object): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.firma`;
}

function dto(overrides: Partial<SignInResponseDto['user']> = {}, accessToken = jwt({ exp: 1_800_000_000 })) {
  return {
    accessToken,
    user: {
      id: 7,
      name: 'Ana',
      lastname: 'López',
      email: 'ana@quijote.mx',
      phone: '5512345678',
      password: '$2b$10$hashDeLaContraseña',
      loginAttempts: 0,
      roleId: 3,
      ...overrides,
    },
  } as SignInResponseDto;
}

describe('toSession', () => {
  it('convierte la respuesta del API en una sesión del dominio', () => {
    expect(toSession(dto())).toEqual({
      token: expect.any(String),
      expiresAt: 1_800_000_000_000,
      user: { id: '7', name: 'Ana', lastname: 'López', email: 'ana@quijote.mx', role: 'mesero' },
    });
  });

  it('descarta el hash de la contraseña y demás columnas de users', () => {
    const serialized = JSON.stringify(toSession(dto()));
    expect(serialized).not.toContain('password');
    expect(serialized).not.toContain('$2b$');
    expect(serialized).not.toContain('5512345678');
  });

  it.each([
    [1, 'admin'],
    [2, 'cajero'],
    [3, 'mesero'],
    [4, 'cocina'],
    [5, 'cliente'],
  ])('mapea roleId %i a "%s"', (roleId, role) => {
    expect(toSession(dto({ roleId })).user.role).toBe(role);
  });

  it('rechaza un rol desconocido o una respuesta sin token', () => {
    expect(() => toSession(dto({ roleId: 99 }))).toThrow('Respuesta de inicio de sesión inválida.');
    expect(() => toSession(dto({}, ''))).toThrow('Respuesta de inicio de sesión inválida.');
  });

  it('usa una hora de vigencia si el token no trae exp', () => {
    expect(toSession(dto({}, jwt({ id: '7' })), 1000).expiresAt).toBe(1000 + 60 * 60 * 1000);
  });
});

describe('jwtExpiration', () => {
  it('devuelve null con un token mal formado', () => {
    expect(jwtExpiration('no-es-un-jwt')).toBeNull();
    expect(jwtExpiration('a.%%%.c')).toBeNull();
  });
});
