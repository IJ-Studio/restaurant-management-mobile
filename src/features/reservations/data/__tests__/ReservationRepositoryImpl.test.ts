import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { ReservationRemoteDataSource } from '../datasources/ReservationRemoteDataSource';
import { toReservation } from '../mappers/reservationMapper';
import { ReservationRepositoryImpl } from '../repositories/ReservationRepositoryImpl';

function setup() {
  const http = { get: jest.fn(), post: jest.fn() } as unknown as jest.Mocked<HttpClient>;
  return { http, repository: new ReservationRepositoryImpl(new ReservationRemoteDataSource(http)) };
}

const row = {
  id: 'b5d1',
  clienteNombre: 'María',
  clienteTelefono: '5512345678',
  clienteEmail: 'maria@correo.mx',
  fechaHora: '2026-10-14T02:00:00.000Z',
  numComensales: 3,
  estatus: 'pendiente',
  mesaId: 4,
  peticionesEspeciales: 'Silla para bebé',
  noShow: false,
};

describe('ReservationRepositoryImpl', () => {
  it('crea con POST /reservations, canal teléfono y fecha en ISO', async () => {
    const { http, repository } = setup();
    http.post.mockResolvedValue(row);
    const dateTime = new Date('2026-10-14T02:00:00.000Z');

    const created = await repository.create({
      customerName: 'María',
      customerPhone: '5512345678',
      customerEmail: 'maria@correo.mx',
      dateTime,
      partySize: 3,
      notes: 'Silla para bebé',
    });

    expect(http.post).toHaveBeenCalledWith('reservations', {
      clienteNombre: 'María',
      clienteTelefono: '5512345678',
      clienteEmail: 'maria@correo.mx',
      fechaHora: '2026-10-14T02:00:00.000Z',
      numComensales: 3,
      peticionesEspeciales: 'Silla para bebé',
      canal: 'telefono',
    });
    expect(created).toEqual({
      id: 'b5d1',
      customerName: 'María',
      customerPhone: '5512345678',
      dateTime,
      partySize: 3,
      status: 'pendiente',
      tableId: 4,
      notes: 'Silla para bebé',
    });
  });

  it('no manda notas vacías', async () => {
    const { http, repository } = setup();
    http.post.mockResolvedValue(row);
    await repository.create({
      customerName: 'A B',
      customerPhone: '5512345678',
      customerEmail: 'a@b.mx',
      dateTime: new Date(),
      partySize: 1,
    });
    expect(http.post.mock.calls[0][1]).not.toHaveProperty('peticionesEspeciales');
  });

  it('lista desde una fecha con GET /reservations?fechaDesde=', async () => {
    const { http, repository } = setup();
    http.get.mockResolvedValue([row]);

    const list = await repository.listFrom(new Date('2026-10-12T06:00:00.000Z'));

    expect(http.get).toHaveBeenCalledWith('reservations?fechaDesde=2026-10-12T06%3A00%3A00.000Z');
    expect(list).toHaveLength(1);
  });

  it('explica el 403 mientras el API solo deje listar a Admin', async () => {
    const { http, repository } = setup();
    http.get.mockRejectedValue(new AppError('forbidden', 'Forbidden resource', 403));
    await expect(repository.listFrom(new Date())).rejects.toMatchObject({
      kind: 'forbidden',
      message: 'Tu rol todavía no puede ver el listado de reservaciones.',
    });
  });

  it('propaga otros errores y rechaza respuestas que no son lista', async () => {
    const { http, repository } = setup();
    http.get.mockRejectedValueOnce(new AppError('network', 'sin red'));
    await expect(repository.listFrom(new Date())).rejects.toMatchObject({ kind: 'network' });
    http.get.mockResolvedValueOnce({});
    await expect(repository.listFrom(new Date())).rejects.toMatchObject({ kind: 'server' });
  });
});

describe('toReservation', () => {
  it('usa valores por defecto para campos vacíos', () => {
    expect(
      toReservation({ ...row, clienteTelefono: null, estatus: null, mesaId: null, peticionesEspeciales: null }),
    ).toMatchObject({ customerPhone: '', status: 'confirmada', tableId: null, notes: '' });
  });

  it('rechaza una fecha inválida', () => {
    expect(() => toReservation({ ...row, fechaHora: 'no-es-fecha' })).toThrow(expect.objectContaining({ kind: 'server' }));
  });
});
