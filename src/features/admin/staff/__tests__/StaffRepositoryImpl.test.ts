import type { HttpClient } from '../../../../core/http/httpClient';
import { StaffRepositoryImpl } from '../data/StaffRepositoryImpl';

const http = () => ({
  get: jest
    .fn()
    .mockResolvedValue([
      {
        id: '7',
        name: 'ANA',
        lastname: 'RUIZ',
        email: 'ana@prueba.local',
        phone: null,
        roleId: 2,
        isActive: false,
      },
    ]),
  post: jest.fn().mockResolvedValue({}),
  patch: jest.fn().mockResolvedValue({}),
  delete: jest.fn().mockResolvedValue({}),
});

describe('StaffRepositoryImpl (mismas llamadas que la web)', () => {
  it('lista con los dados de baja y traduce el DTO', async () => {
    const h = http();
    const list = await new StaffRepositoryImpl(h as unknown as HttpClient).list();
    expect(h.get).toHaveBeenCalledWith('users?incluirInactivos=true&limit=100');
    expect(list).toEqual([
      {
        id: 7,
        name: 'ANA',
        lastname: 'RUIZ',
        email: 'ana@prueba.local',
        phone: null,
        roleId: 2,
        active: false,
      },
    ]);
  });

  it('alta, edición, rol, baja lógica y reactivación', async () => {
    const h = http();
    const r = new StaffRepositoryImpl(h as unknown as HttpClient);
    const input = {
      name: 'A',
      lastname: 'B',
      email: 'a@b.mx',
      phone: '+527710000000',
      password: '12345678',
      roleId: 3,
    };
    await r.create(input);
    await r.update(7, { name: 'A', lastname: 'B', phone: '+527710000000' });
    await r.changeRole(7, 4);
    await r.deactivate(7);
    await r.reactivate(7);
    expect(h.post).toHaveBeenCalledWith('users', input);
    expect(h.patch.mock.calls).toEqual([
      ['users/7', { name: 'A', lastname: 'B', phone: '+527710000000' }],
      ['users/7/role', { roleId: 4 }],
      ['users/7/reactivar'],
    ]);
    expect(h.delete).toHaveBeenCalledWith('users/7');
  });
});
