import { makeDraft, makeReservation, makeReservationRepository, NOW } from '../../__fixtures__/reservations';
import { CreateReservationUseCase } from '../usecases/CreateReservationUseCase';
import { ListActiveReservationsUseCase } from '../usecases/ListActiveReservationsUseCase';

describe('CreateReservationUseCase', () => {
  it('envía la reservación limpia al repositorio', async () => {
    const repository = makeReservationRepository();
    await new CreateReservationUseCase(repository, () => NOW).execute(
      makeDraft({ customerName: '  Laura Méndez ', occasion: '  ', specialRequests: ' Silla para bebé ' }),
    );

    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: 'Laura Méndez',
        occasion: undefined,
        specialRequests: 'Silla para bebé',
      }),
    );
  });

  it('una reservación inválida no se envía y explica el motivo', async () => {
    const repository = makeReservationRepository();

    await expect(
      new CreateReservationUseCase(repository, () => NOW).execute(makeDraft({ partySize: 0 })),
    ).rejects.toMatchObject({ kind: 'validation', message: 'Debe haber al menos 1 persona.' });
    expect(repository.create).not.toHaveBeenCalled();
  });
});

describe('ListActiveReservationsUseCase', () => {
  it('pide las reservaciones desde el inicio del día y deja solo las activas en orden', async () => {
    const repository = makeReservationRepository([
      makeReservation({ id: 'tarde', dateTime: '2026-10-21T03:00:00.000Z' }),
      makeReservation({ id: 'cancelada', status: 'cancelada' }),
      makeReservation({ id: 'temprano', dateTime: '2026-10-20T20:00:00.000Z', status: 'pendiente' }),
      makeReservation({ id: 'completada', status: 'completada' }),
    ]);

    const list = await new ListActiveReservationsUseCase(repository, () => NOW).execute();

    const from = repository.listFrom.mock.calls[0][0];
    expect([from.getHours(), from.getMinutes(), from.getSeconds()]).toEqual([0, 0, 0]);
    expect(list.map((r) => r.id)).toEqual(['temprano', 'tarde']);
  });
});

describe('reloj por defecto', () => {
  it('CreateReservationUseCase valida contra la hora actual', async () => {
    const repository = makeReservationRepository();
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await new CreateReservationUseCase(repository).execute(makeDraft({ dateTime: nextWeek }));
    await expect(
      new CreateReservationUseCase(repository).execute(makeDraft({ dateTime: new Date(Date.now() - 1000) })),
    ).rejects.toMatchObject({ message: 'La fecha ya pasó.' });
    expect(repository.create).toHaveBeenCalledTimes(1);
  });

  it('ListActiveReservationsUseCase consulta desde el inicio de hoy', async () => {
    const repository = makeReservationRepository([]);
    await new ListActiveReservationsUseCase(repository).execute();

    expect(repository.listFrom.mock.calls[0][0].toDateString()).toBe(new Date().toDateString());
  });
});
