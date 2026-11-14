import { AppError } from '../../../../core/errors/AppError';
import type { HttpClient } from '../../../../core/http/httpClient';
import { makeDraft } from '../../__fixtures__/reservations';
import { ReservationRemoteDataSource } from '../datasources/ReservationRemoteDataSource';
import type { ReservationDto } from '../dtos/ReservationDto';
import { ReservationRepositoryImpl } from '../repositories/ReservationRepositoryImpl';

const row: ReservationDto = {
  id: 'uuid-1',
  mesaId: 7,
  userId: null,
  clienteNombre: 'Laura Méndez',
  clienteTelefono: '55 1234 5678',
  clienteEmail: 'laura@correo.mx',
  fechaHora: '2026-10-21T02:00:00+00:00',
  numComensales: 4,
  ocasion: null,
  peticionesEspeciales: 'Silla para bebé',
  estatus: 'pendiente',
  canal: 'telefono',
  depositoPagado: '0',
};

function setup(http: Partial<Record<'get' | 'post' | 'patch', jest.Mock>>) {
  return new ReservationRepositoryImpl(new ReservationRemoteDataSource(http as unknown as HttpClient));
}

describe('ReservationRepositoryImpl', () => {
  it('envía la reservación con el formato del API', async () => {
    const post = jest.fn().mockResolvedValue({
      ...row,
      requiereConfirmacion: true,
      mensaje: 'Reserva creada. Confirma en 2 días.',
    });
    const created = await setup({ post }).create(makeDraft({ specialRequests: 'Silla para bebé' }));

    expect(post).toHaveBeenCalledWith('reservations', {
      clienteNombre: 'Laura Méndez',
      clienteTelefono: '55 1234 5678',
      clienteEmail: 'laura@correo.mx',
      fechaHora: '2026-10-21T02:00:00.000Z',
      numComensales: 4,
      ocasion: undefined,
      peticionesEspeciales: 'Silla para bebé',
      canal: 'telefono',
    });
    expect(created).toEqual({
      reservation: expect.objectContaining({
        id: 'uuid-1',
        tableId: 7,
        status: 'pendiente',
        specialRequests: 'Silla para bebé',
      }),
      requiresConfirmation: true,
      message: 'Reserva creada. Confirma en 2 días.',
    });
  });

  it('usa un mensaje por defecto si el API no manda uno', async () => {
    const post = jest.fn().mockResolvedValue({ ...row, requiereConfirmacion: false, mensaje: '' });
    await expect(setup({ post }).create(makeDraft())).resolves.toMatchObject({
      message: 'Reservación registrada.',
    });
  });

  it('muestra tal cual los motivos de negocio del API', async () => {
    const post = jest.fn().mockRejectedValue(new AppError('validation', 'No hay mesas disponibles', 400));
    await expect(setup({ post }).create(makeDraft())).rejects.toThrow('No hay mesas disponibles');
  });

  it('lista desde una fecha y mapea las filas', async () => {
    const get = jest.fn().mockResolvedValue([{ ...row, mesaId: null, estatus: null, clienteTelefono: null }]);
    const list = await setup({ get }).listFrom(new Date('2026-10-20T06:00:00.000Z'));

    expect(get).toHaveBeenCalledWith('reservations?fechaDesde=2026-10-20T06%3A00%3A00.000Z');
    expect(list[0]).toMatchObject({ id: 'uuid-1', status: 'confirmada', partySize: 4 });
    expect(list[0].tableId).toBeUndefined();
    expect(list[0].customerPhone).toBeUndefined();
  });

  it('convierte la fecha de Postgres a ISO para que Hermes la entienda', async () => {
    const get = jest.fn().mockResolvedValue([{ ...row, fechaHora: '2026-10-02 20:30:00+00' }]);
    const [reservation] = await setup({ get }).listFrom(new Date());

    expect(reservation.dateTime).toBe('2026-10-02T20:30:00+00:00');
  });

  it('explica un 403 (el API hoy solo deja listar al administrador)', async () => {
    const get = jest.fn().mockRejectedValue(new AppError('forbidden', 'Forbidden resource', 403));
    await expect(setup({ get }).listFrom(new Date())).rejects.toThrow(
      'Tu rol no tiene permiso para ver las reservaciones.',
    );
  });

  it('deja pasar otros errores', async () => {
    const error = new AppError('network', 'No hay conexión con el servidor.');
    await expect(setup({ get: jest.fn().mockRejectedValue(error) }).listFrom(new Date())).rejects.toBe(error);
  });

  describe('cambiar el estado', () => {
    it('manda solo el estado al confirmar', async () => {
      const patch = jest.fn().mockResolvedValue({});

      await setup({ patch }).changeStatus('r 1', 'confirmada');

      expect(patch).toHaveBeenCalledWith('reservations/r%201', { estatus: 'confirmada' });
    });

    it('manda el motivo al cancelar', async () => {
      const patch = jest.fn().mockResolvedValue({});

      await setup({ patch }).changeStatus('r-1', 'cancelada', 'Llamó para cancelar');

      expect(patch).toHaveBeenCalledWith('reservations/r-1', {
        estatus: 'cancelada',
        motivoCancelacion: 'Llamó para cancelar',
      });
    });

    it('explica un 403 y deja pasar otros errores', async () => {
      const forbidden = jest.fn().mockRejectedValue(new AppError('forbidden', 'Forbidden resource', 403));
      await expect(setup({ patch: forbidden }).changeStatus('r-1', 'confirmada')).rejects.toThrow(
        'Solo el administrador puede cambiar el estado de una reservación.',
      );

      const offline = new AppError('network', 'Sin conexión');
      await expect(
        setup({ patch: jest.fn().mockRejectedValue(offline) }).changeStatus('r-1', 'confirmada'),
      ).rejects.toBe(offline);
    });
  });

  it('pide las mesas libres con la fecha y hora del restaurante', async () => {
    const get = jest.fn().mockResolvedValue({
      mesasDisponibles: [{ id: 3, numero: 'A03', capacidad: 4 }],
    });

    // 02:00 UTC del sábado = 20:00 del viernes en México (−360).
    const tables = await setup({ get }).freeTables(new Date('2026-11-14T02:00:00Z'), 4, -360);

    expect(get).toHaveBeenCalledWith(
      'reservations/availability?fecha=2026-11-13&hora=20%3A00&numComensales=4',
    );
    expect(tables).toEqual([{ id: 3, number: 'A03', capacity: 4 }]);
  });
});
