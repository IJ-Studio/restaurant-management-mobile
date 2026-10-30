import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { ProfileRemoteDataSource } from '../datasources/ProfileRemoteDataSource';
import { ProfileRepositoryImpl } from '../repositories/ProfileRepositoryImpl';

const dto = {
  id: 59,
  name: 'administrador',
  lastname: 'test',
  email: 'admin@quijote.mx',
  phone: '+520000000000',
  roleId: 1,
  isActive: true,
};

function setup(http: Partial<Record<'get' | 'patch', jest.Mock>>) {
  return new ProfileRepositoryImpl(new ProfileRemoteDataSource(http as unknown as HttpClient));
}

describe('ProfileRepositoryImpl', () => {
  it('lee el perfil sin columnas extra', async () => {
    const get = jest.fn().mockResolvedValue(dto);
    await expect(setup({ get }).get('59')).resolves.toEqual({
      id: '59',
      name: 'administrador',
      lastname: 'test',
      email: 'admin@quijote.mx',
      phone: '+520000000000',
    });
    expect(get).toHaveBeenCalledWith('users/59');
  });

  it('actualiza con PATCH /users/:id; sin teléfono queda undefined', async () => {
    const patch = jest.fn().mockResolvedValue({ ...dto, name: 'Ana', phone: null });
    await expect(setup({ patch }).update('59', { name: 'Ana', lastname: 'test' })).resolves.toMatchObject({
      name: 'Ana',
      phone: undefined,
    });
    expect(patch).toHaveBeenCalledWith('users/59', { name: 'Ana', lastname: 'test' });
  });

  it('cambia la contraseña con los nombres de campo del API', async () => {
    const patch = jest.fn().mockResolvedValue({ message: 'ok' });
    await setup({ patch }).changePassword('59', 'Vieja#2026', 'Nueva#2026');
    expect(patch).toHaveBeenCalledWith('users/59/password', {
      currentPassword: 'Vieja#2026',
      newPassword: 'Nueva#2026',
    });
  });

  it('traduce los mensajes en inglés del API y deja pasar los demás', async () => {
    const phone = jest
      .fn()
      .mockRejectedValue(new AppError('validation', 'phone must be in international format', 400));
    await expect(
      setup({ patch: phone }).update('59', { name: 'a', lastname: 'b', phone: '1' }),
    ).rejects.toThrow('El teléfono debe llevar lada internacional (+52…).');

    const weak = jest
      .fn()
      .mockRejectedValue(new AppError('validation', 'password too weak: needs a symbol', 400));
    await expect(setup({ patch: weak }).changePassword('59', 'a', 'b')).rejects.toThrow(
      'La contraseña nueva no cumple los requisitos.',
    );

    const wrong = new AppError('validation', 'La contraseña actual no es correcta', 400);
    await expect(
      setup({ patch: jest.fn().mockRejectedValue(wrong) }).changePassword('59', 'a', 'b'),
    ).rejects.toBe(wrong);
    const offline = new Error('offline');
    await expect(
      setup({ patch: jest.fn().mockRejectedValue(offline) }).update('59', { name: 'a', lastname: 'b' }),
    ).rejects.toBe(offline);
  });
});
