import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { SaveTableUseCase, type AdminTable, type TablesRepository } from '../domain/Tables';
import { TablesScreen } from '../presentation/TablesScreen';

const table = (extra: Partial<AdminTable> = {}): AdminTable => ({
  id: 1,
  number: 'S01',
  name: null,
  capacity: 4,
  shape: 'cuadrada',
  areaId: 1,
  areaName: 'SALÓN PRINCIPAL',
  active: true,
  hasHistory: true,
  upcomingReservations: 2,
  ...extra,
});

const repo = (): jest.Mocked<TablesRepository> => ({
  list: jest
    .fn()
    .mockResolvedValue([
      table(),
      table({ id: 2, number: 'T09', hasHistory: false, upcomingReservations: 0, active: false }),
    ]),
  areas: jest.fn().mockResolvedValue([{ id: 2, name: 'TERRAZA' }]),
  create: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue({
    result: 'desactivada',
    message: 'La mesa tiene historial: se desactivó en lugar de borrarla.',
  }),
});

describe('mesas: dominio (Prioridad 1.3)', () => {
  it('valida número, capacidad y forma como el API; no llama al API si falta algo', async () => {
    const r = repo();
    const uc = new SaveTableUseCase(r);
    const base = { number: ' t5 ', name: ' ', capacity: 4, shape: 'redonda', areaId: null };
    await expect(uc.execute({ ...base, number: ' ' })).rejects.toThrow('número');
    await expect(uc.execute({ ...base, capacity: 31 })).rejects.toThrow('capacidad');
    await expect(uc.execute({ ...base, shape: 'ovalada' })).rejects.toThrow('forma');
    expect(r.create).not.toHaveBeenCalled();
    await uc.execute(base);
    expect(r.create).toHaveBeenCalledWith({ ...base, number: 't5', name: null });
    await uc.execute(base, 7);
    expect(r.update).toHaveBeenCalledWith(7, expect.objectContaining({ number: 't5' }));
  });
});

describe('mesas: pantalla', () => {
  it('lista, añade una mesa y la baja con historial avisa que solo se desactiva', async () => {
    const r = repo();
    const deps = makeTestDependencies({ tablesRepository: r, saveTableUseCase: new SaveTableUseCase(r) });
    await renderWithProviders(<TablesScreen />, deps);

    expect(await screen.findByText('S01')).toBeOnTheScreen();
    expect(screen.getByText('Salón Principal · 4 pers. · Cuadrada · 2 reservas por venir')).toBeOnTheScreen();
    expect(screen.getByText('Inactiva')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Mesa nueva' }));
    await fireEvent.changeText(screen.getByLabelText('Número'), 'T10');
    await fireEvent.changeText(screen.getByLabelText('Capacidad'), '2');
    await fireEvent.press(screen.getByRole('radio', { name: 'Terraza' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Añadir mesa' }));
    await waitFor(() =>
      expect(r.create).toHaveBeenCalledWith({
        number: 'T10',
        name: null,
        capacity: 2,
        shape: 'cuadrada',
        areaId: 2,
      }),
    );
    expect(await screen.findByText('Mesa añadida.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Dar de baja la mesa S01' }));
    expect(
      screen.getByText('Tiene historial o reservas activas: se desactivará y se conserva todo.'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Desactivar mesa' }));
    await waitFor(() => expect(r.remove).toHaveBeenCalledWith(1));
    expect(
      await screen.findByText('La mesa tiene historial: se desactivó en lugar de borrarla.'),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('button', { name: 'Activar la mesa T09' }));
    await waitFor(() => expect(r.update).toHaveBeenCalledWith(2, { active: true }));
  });
});
