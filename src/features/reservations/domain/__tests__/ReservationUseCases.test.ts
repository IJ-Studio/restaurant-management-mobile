import type { Reservation } from '../entities/Reservation';
import type { ReservationDraft } from '../entities/reservationRules';
import type { ReservationRepository } from '../repositories/ReservationRepository';
import { CreateReservationUseCase } from '../usecases/CreateReservationUseCase';
import { GetActiveReservationsUseCase } from '../usecases/GetActiveReservationsUseCase';

const NOW = new Date(2026, 9, 12, 12, 0);

const reservation = (id: string, dateTime: Date, status = 'confirmada'): Reservation => ({
  id,
  customerName: id,
  customerPhone: '5512345678',
  dateTime,
  partySize: 2,
  status,
  tableId: null,
  notes: '',
});

function makeRepository(list: Reservation[] = []): jest.Mocked<ReservationRepository> {
  return {
    create: jest.fn().mockImplementation(async (r) => reservation('nueva', r.dateTime, 'pendiente')),
    listFrom: jest.fn().mockResolvedValue(list),
  };
}

const draft: ReservationDraft = {
  customerName: 'María',
  customerPhone: '5512345678',
  customerEmail: 'maria@correo.mx',
  date: '2026-10-13',
  time: '20:00',
  partySize: '3',
  notes: '',
};

describe('CreateReservationUseCase', () => {
  it('crea la reservación con los datos validados', async () => {
    const repository = makeRepository();
    await new CreateReservationUseCase(repository, () => NOW).execute(draft);
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerName: 'María', partySize: 3, dateTime: new Date(2026, 9, 13, 20, 0) }),
    );
  });

  it('una reservación inválida no llega al API', async () => {
    const repository = makeRepository();
    await expect(
      new CreateReservationUseCase(repository, () => NOW).execute({ ...draft, partySize: '0' }),
    ).rejects.toMatchObject({ kind: 'validation', message: 'Debe haber al menos 1 persona.' });
    expect(repository.create).not.toHaveBeenCalled();
  });
});

describe('GetActiveReservationsUseCase', () => {
  it('pide desde el inicio de hoy y devuelve solo las activas, de la más próxima a la más lejana', async () => {
    const repository = makeRepository([
      reservation('mañana', new Date(2026, 9, 13, 20, 0)),
      reservation('hoy-tarde', new Date(2026, 9, 12, 21, 0), 'pendiente'),
      reservation('cancelada', new Date(2026, 9, 12, 14, 0), 'cancelada'),
      reservation('completada', new Date(2026, 9, 12, 9, 0), 'completada'),
      reservation('hoy-temprano', new Date(2026, 9, 12, 10, 0)),
      reservation('ayer', new Date(2026, 9, 11, 20, 0)),
    ]);

    const result = await new GetActiveReservationsUseCase(repository, () => NOW).execute();

    expect(repository.listFrom).toHaveBeenCalledWith(new Date(2026, 9, 12));
    expect(result.map((r) => r.id)).toEqual(['hoy-temprano', 'hoy-tarde', 'mañana']);
  });
});
