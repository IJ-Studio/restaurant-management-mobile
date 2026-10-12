import { toSession } from '../mappers/sessionMapper';
import type { SignInResponseDto } from '../dtos/SignInDto';

const dto: SignInResponseDto = {
  accessToken: 'a.b.c',
  user: {
    id: 12,
    name: 'Ana',
    lastname: 'López',
    email: 'ana@resto.mx',
    roleId: 3,
    password: '$2b$10$hash',
    loginAttempts: 0,
    phone: '5551234567',
  },
};

describe('toSession', () => {
  it('toma solo los campos que usa la app', () => {
    const session = toSession(dto);
    expect(session).toEqual({
      token: 'a.b.c',
      user: { id: '12', name: 'Ana', lastname: 'López', email: 'ana@resto.mx', role: 'mesero' },
    });
    // El API hoy regresa el hash de la contraseña: nunca debe llegar al dispositivo.
    expect(JSON.stringify(session)).not.toContain('hash');
    expect(JSON.stringify(session)).not.toContain('5551234567');
  });

  it.each([
    [1, 'admin'],
    [2, 'cajero'],
    [3, 'mesero'],
    [4, 'cocina'],
  ])('mapea roleId %i a %s', (roleId, role) => {
    expect(toSession({ ...dto, user: { ...dto.user, roleId } }).user.role).toBe(role);
  });

  it('rechaza a un cliente (rol 5): la app es solo para el personal', () => {
    expect(() => toSession({ ...dto, user: { ...dto.user, roleId: 5 } })).toThrow(
      expect.objectContaining({ kind: 'forbidden' }),
    );
  });

  it('rechaza una respuesta sin token', () => {
    expect(() => toSession({ ...dto, accessToken: '' })).toThrow(expect.objectContaining({ kind: 'server' }));
  });
});
