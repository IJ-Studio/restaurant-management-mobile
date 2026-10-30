import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '../../../core/errors/AppError';
import type { Dependencies } from '../../../core/di/dependencies';
import type { HttpClient } from '../../../core/http/httpClient';
import { makeTestDependencies } from '../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../core/testing/renderWithProviders';
import { makeSession } from '../../auth/__fixtures__/auth';
import { CheckoutNavigator } from '../../orders/presentation/navigation/CheckoutNavigator';
import { CashRegisterRepositoryImpl } from '../data/CashRegisterRepositoryImpl';
import {
  cashDifference,
  CloseCashRegisterUseCase,
  differenceLabel,
  GetCashSessionUseCase,
  OpenCashRegisterUseCase,
  type CashRegisterRepository,
  type CashSession,
} from '../domain/CashRegister';

jest.setTimeout(20_000);

const sessionDto = {
  abierta: true,
  id: 7,
  fechaApertura: '2026-10-28 14:00:00+00',
  fondoInicial: '500.00',
  efectivoVentas: '300.00',
  tarjetaVentas: '200.00',
  digitalVentas: '100.00',
  totalVentas: '600.00',
  propinas: '50.00',
  numPagos: 3,
  efectivoEsperado: '830.00',
  efectivoContado: null,
  diferencia: null,
};

const session: CashSession = {
  id: 7,
  open: true,
  openedAt: '2026-10-28T14:00:00+00:00',
  closedAt: undefined,
  openingFloat: 500,
  cashSales: 300,
  cardSales: 200,
  digitalSales: 100,
  totalSales: 600,
  tips: 50,
  payments: 3,
  expectedCash: 830,
  countedCash: undefined,
  difference: undefined,
};

describe('CashRegisterRepositoryImpl', () => {
  const repo = (http: Partial<Record<'get' | 'post', jest.Mock>>) =>
    new CashRegisterRepositoryImpl(http as unknown as HttpClient);

  it('lee el turno abierto o null', async () => {
    await expect(repo({ get: jest.fn().mockResolvedValue(sessionDto) }).current()).resolves.toEqual(session);
    await expect(
      repo({ get: jest.fn().mockResolvedValue({ abierta: false }) }).current(),
    ).resolves.toBeNull();
  });

  it('abre y cierra con los campos del API', async () => {
    const post = jest
      .fn()
      .mockResolvedValueOnce({ caja: sessionDto })
      .mockResolvedValueOnce({
        message: 'Caja cerrada con $20.00 de sobrante.',
        caja: {
          ...sessionDto,
          abierta: false,
          efectivoContado: '850.00',
          diferencia: '20.00',
          fechaCierre: '2026-10-28 23:00:00+00',
        },
      });
    const repository = repo({ post });

    await expect(repository.open(500)).resolves.toEqual(session);
    expect(post).toHaveBeenCalledWith('caja/abrir', { fondoInicial: 500 });

    await expect(repository.close(850, 'ok')).resolves.toMatchObject({
      message: 'Caja cerrada con $20.00 de sobrante.',
      session: { open: false, countedCash: 850, difference: 20, closedAt: '2026-10-28T23:00:00+00:00' },
    });
    expect(post).toHaveBeenLastCalledWith('caja/cerrar', { efectivoContado: 850, notas: 'ok' });
  });

  it('explica el 403 y deja pasar los demás errores', async () => {
    const forbidden = jest.fn().mockRejectedValue(new AppError('forbidden', 'Forbidden resource', 403));
    await expect(repo({ get: forbidden }).current()).rejects.toThrow(
      'Solo caja puede abrir o cerrar turnos.',
    );
    const conflict = new AppError('unknown', 'Ya tienes una caja abierta.', 409);
    await expect(repo({ post: jest.fn().mockRejectedValue(conflict) }).open(0)).rejects.toBe(conflict);
    await expect(repo({ post: jest.fn().mockRejectedValue(conflict) }).close(0)).rejects.toBe(conflict);
  });
});

describe('reglas del corte', () => {
  const repository = (): jest.Mocked<CashRegisterRepository> => ({
    current: jest.fn().mockResolvedValue(session),
    open: jest.fn().mockResolvedValue(session),
    close: jest.fn().mockResolvedValue({ message: 'ok', session }),
  });

  it('calcula y describe la diferencia sin errores de centavos', () => {
    expect(cashDifference(830.1, 830.3)).toBe(0.2);
    expect(differenceLabel(0)).toBe('Cuadra');
    expect(differenceLabel(20)).toBe('Sobran $20.00');
    expect(differenceLabel(-30.5)).toBe('Faltan $30.50');
  });

  it('valida el fondo y el conteo antes de llamar al API', async () => {
    const repo = repository();
    await expect(new GetCashSessionUseCase(repo).execute()).resolves.toBe(session);
    await expect(new OpenCashRegisterUseCase(repo).execute(-1)).rejects.toThrow('fondo inicial');
    await expect(new CloseCashRegisterUseCase(repo).execute(Number.NaN)).rejects.toThrow('efectivo contaste');
    expect(repo.open).not.toHaveBeenCalled();
    await new OpenCashRegisterUseCase(repo).execute(500.555);
    expect(repo.open).toHaveBeenCalledWith(500.56);
    await new CloseCashRegisterUseCase(repo).execute(850, '  ');
    expect(repo.close).toHaveBeenCalledWith(850, undefined);
  });
});

describe('Pantalla de corte de caja', () => {
  function setup(overrides: Partial<Dependencies>) {
    const deps = makeTestDependencies({
      listActiveOrdersUseCase: { execute: jest.fn().mockResolvedValue([]) },
      ...overrides,
    });
    const s = makeSession();
    s.user.role = 'cajero';
    deps.sessionStore.getState().setSession(s);
    return deps;
  }

  async function render(deps: Dependencies) {
    await renderWithProviders(
      <NavigationContainer>
        <CheckoutNavigator />
      </NavigationContainer>,
      deps,
    );
  }

  it('con la caja cerrada avisa en Cobros y permite abrirla con fondo', async () => {
    const open = jest
      .fn()
      .mockResolvedValue({ ...session, cashSales: 0, totalSales: 0, payments: 0, expectedCash: 500 });
    const deps = setup({
      getCashSessionUseCase: { execute: jest.fn().mockResolvedValue(null) },
      openCashRegisterUseCase: { execute: open },
    });
    await render(deps);

    expect(await screen.findByText(/Tu caja está cerrada/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir caja' }));

    expect(await screen.findByRole('header', { name: 'Tu caja está cerrada' })).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Fondo inicial'), '500');
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir caja' }));

    expect(open).toHaveBeenCalledWith(500);
    expect(await screen.findByLabelText('Debe haber en caja, $500.00, fondo $500.00')).toBeOnTheScreen();
  });

  it('muestra lo del turno, calcula la diferencia y cierra', async () => {
    const close = jest.fn().mockResolvedValue({
      message: 'Caja cerrada con $20.00 de sobrante.',
      session: { ...session, open: false, countedCash: 850, difference: 20 },
    });
    const deps = setup({
      getCashSessionUseCase: { execute: jest.fn().mockResolvedValue(session) },
      closeCashRegisterUseCase: { execute: close },
    });
    await render(deps);
    await fireEvent.press(await screen.findByRole('button', { name: 'Corte de caja' }));

    expect(await screen.findByLabelText('Efectivo, $300.00')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tarjeta, $200.00')).toBeOnTheScreen();
    expect(screen.getByLabelText('Debe haber en caja, $830.00, fondo $500.00')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Cerrar caja' })).toBeDisabled();

    await fireEvent.changeText(screen.getByLabelText('Efectivo contado'), '800');
    expect(screen.getByLabelText('Diferencia: Faltan $30.00')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Efectivo contado'), '850');
    await fireEvent.changeText(screen.getByLabelText('Notas del corte'), 'Todo bien');
    await fireEvent.press(screen.getByRole('button', { name: 'Cerrar caja' }));

    await waitFor(() => expect(close).toHaveBeenCalledWith(850, 'Todo bien'));
    expect(await screen.findByText('Caja cerrada con $20.00 de sobrante.')).toBeOnTheScreen();
    expect(screen.getByText('Sobran $20.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Listo' }));
    expect(await screen.findByText('Tu caja está cerrada')).toBeOnTheScreen();
  });

  it('muestra el error del API al abrir y cuando no puede consultar', async () => {
    const deps = setup({
      getCashSessionUseCase: { execute: jest.fn().mockResolvedValue(null) },
      openCashRegisterUseCase: {
        execute: jest.fn().mockRejectedValue(new AppError('validation', 'Ya tienes una caja abierta.')),
      },
    });
    await render(deps);
    await fireEvent.press(await screen.findByRole('button', { name: 'Corte de caja' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Abrir caja' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ya tienes una caja abierta.');
  });

  it('si no puede consultar la caja permite reintentar', async () => {
    // La lista de Cobros y la pantalla de caja comparten la consulta: fallan las dos primeras.
    const execute = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(null);
    await render(setup({ getCashSessionUseCase: { execute } }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Corte de caja' }));
    expect(await screen.findByText('No se pudo consultar tu caja.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Tu caja está cerrada')).toBeOnTheScreen();
  });
});
