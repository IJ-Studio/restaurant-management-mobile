import { NavigationContainer } from '@react-navigation/native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { AppError } from '../../../core/errors/AppError';
import type { Dependencies } from '../../../core/di/dependencies';
import type { HttpClient } from '../../../core/http/httpClient';
import { makeTestDependencies } from '../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../core/testing/renderWithProviders';
import { makeSession } from '../../auth/__fixtures__/auth';
import type { Role } from '../../auth/domain/entities/Role';
import { makeActiveOrder, makeOrderDetail } from '../../orders/__fixtures__/orders';
import { OrdersNavigator } from '../../orders/presentation/navigation/OrdersNavigator';
import { KitchenRepositoryImpl } from '../data/KitchenRepositoryImpl';
import {
  incidentLabel,
  ListIncidentsUseCase,
  ListInventoryProductsUseCase,
  ListWasteTodayUseCase,
  ReportIncidentUseCase,
  ReportWasteUseCase,
  searchProducts,
  wasteReasonLabel,
  type KitchenRepository,
} from '../domain/Kitchen';
import { incidentSummary } from '../presentation/viewmodels';

jest.setTimeout(20_000);

const aguacate = { id: 31, name: 'Aguacate', category: 'vegetales', unit: 'kg', stock: 5, costPerUnit: 120 };
const crema = { id: 40, name: 'Crema ácida', category: 'lácteos', unit: 'lt', stock: 3, costPerUnit: 60 };

function repository(): jest.Mocked<KitchenRepository> {
  return {
    listIncidents: jest.fn().mockResolvedValue([]),
    reportIncident: jest.fn().mockResolvedValue('Incidencia reportada.'),
    listProducts: jest.fn().mockResolvedValue([crema, aguacate]),
    reportWaste: jest.fn().mockResolvedValue('Merma registrada.'),
    listWasteToday: jest.fn().mockResolvedValue([]),
  };
}

describe('reglas de cocina', () => {
  it('un retraso necesita minutos y "otro" una explicación', async () => {
    const repo = repository();
    const report = new ReportIncidentUseCase(repo);
    await expect(report.execute({ type: 'retraso' })).rejects.toThrow('minutos');
    await expect(report.execute({ type: 'otro', message: '  ' })).rejects.toThrow('Describe qué pasó.');
    await expect(report.execute({ type: 'equipo', message: 'x'.repeat(301) })).rejects.toThrow('largo');
    await report.execute({ type: 'falta_insumo', minutes: 10, message: ' Sin aguacate ', orderId: 'o1' });
    expect(repo.reportIncident).toHaveBeenCalledWith({
      type: 'falta_insumo',
      minutes: undefined,
      message: 'Sin aguacate',
      orderId: 'o1',
    });
  });

  it('una merma necesita producto o nombre, cantidad y justificación', async () => {
    const repo = repository();
    const report = new ReportWasteUseCase(repo);
    const base = { quantity: 1, reason: 'caducado' as const, justification: 'Se echó a perder' };
    await expect(report.execute({ ...base })).rejects.toThrow('Elige un producto');
    await expect(report.execute({ ...base, productId: 31, quantity: 0 })).rejects.toThrow('mayor a cero');
    await expect(report.execute({ ...base, productId: 31, justification: 'x' })).rejects.toThrow('Explica');
    await report.execute({ ...base, productId: 31, productName: 'ignorado' });
    expect(repo.reportWaste).toHaveBeenCalledWith(
      expect.objectContaining({ productId: 31, productName: undefined }),
    );
    await report.execute({ ...base, productName: ' Salsa verde ' });
    expect(repo.reportWaste).toHaveBeenLastCalledWith(
      expect.objectContaining({ productName: 'Salsa verde' }),
    );
  });

  it('busca productos sin acentos y ordena el inventario', async () => {
    expect(searchProducts([aguacate, crema], 'acida').map((p) => p.name)).toEqual(['Crema ácida']);
    expect(searchProducts([aguacate, crema], 'LACTEOS')).toHaveLength(1);
    expect(searchProducts([aguacate, crema], '', 1)).toHaveLength(1);
    const repo = repository();
    await expect(new ListInventoryProductsUseCase(repo).execute()).resolves.toEqual([aguacate, crema]);
    await expect(new ListIncidentsUseCase(repo).execute('o1')).resolves.toEqual([]);
    expect(repo.listIncidents).toHaveBeenCalledWith('o1');
    await expect(new ListWasteTodayUseCase(repo).execute()).resolves.toEqual([]);
  });

  it('etiquetas y resumen de incidencias', () => {
    expect(incidentLabel('falta_insumo')).toBe('Falta insumo');
    expect(incidentLabel('raro')).toBe('Incidencia');
    expect(wasteReasonLabel('danado')).toBe('Dañado');
    expect(wasteReasonLabel('x')).toBe('x');
    expect(incidentSummary({ id: '1', type: 'retraso', minutes: 15, reportedBy: 'Diego' })).toBe(
      'Retraso de 15 min · Diego',
    );
    expect(incidentSummary({ id: '2', type: 'equipo', message: 'Horno' })).toBe('Falla de equipo · Horno');
  });
});

describe('KitchenRepositoryImpl', () => {
  const repo = (http: Partial<Record<'get' | 'post', jest.Mock>>) =>
    new KitchenRepositoryImpl(http as unknown as HttpClient);

  it('mapea incidencias, productos y mermas del API', async () => {
    const get = jest.fn((path: string) => {
      if (path.startsWith('cocina/incidencias')) {
        return Promise.resolve([
          {
            id: '9',
            ordenId: 'o1',
            tipo: 'retraso',
            mensaje: ' Horno lento ',
            minutos: 15,
            mesa: 'S01',
            reportadoPor: 'Diego Luna',
            creadoEn: '2026-10-28 20:00:00+00',
          },
          {
            id: '10',
            ordenId: null,
            tipo: 'equipo',
            mensaje: null,
            minutos: null,
            mesa: null,
            reportadoPor: null,
            creadoEn: null,
          },
        ]);
      }
      if (path === 'inventario/productos') {
        return Promise.resolve([
          {
            id: 31,
            name: 'Aguacate',
            category: 'vegetales',
            unit: 'kg',
            stock: '5.000',
            costPerUnit: '120.00',
          },
        ]);
      }
      return Promise.resolve([
        {
          id: 1,
          productName: 'Aguacate',
          quantity: '1.500',
          unit: 'kg',
          reason: 'caducado',
          justification: 'Se oxidó',
          reportedBy: '',
          cost: '180.00',
          createdAt: '2026-10-28 20:00:00',
        },
      ]);
    });
    const r = repo({ get });

    await expect(r.listIncidents('o1')).resolves.toEqual([
      {
        id: '9',
        orderId: 'o1',
        type: 'retraso',
        message: 'Horno lento',
        minutes: 15,
        table: 'S01',
        reportedBy: 'Diego Luna',
        at: '2026-10-28T20:00:00+00:00',
      },
      {
        id: '10',
        orderId: undefined,
        type: 'equipo',
        message: undefined,
        minutes: undefined,
        table: undefined,
        reportedBy: undefined,
        at: undefined,
      },
    ]);
    expect(get).toHaveBeenCalledWith('cocina/incidencias?ordenId=o1');
    await r.listIncidents();
    expect(get).toHaveBeenLastCalledWith('cocina/incidencias');
    await expect(r.listProducts()).resolves.toEqual([aguacate]);
    await expect(r.listWasteToday()).resolves.toEqual([
      {
        id: 1,
        productName: 'Aguacate',
        quantity: 1.5,
        unit: 'kg',
        reason: 'caducado',
        justification: 'Se oxidó',
        reportedBy: undefined,
        cost: 180,
        at: '2026-10-28T20:00:00Z',
      },
    ]);
  });

  it('manda los reportes con los campos del API y explica el 403', async () => {
    const post = jest.fn().mockResolvedValue({ message: '' });
    const r = repo({ post });
    await expect(r.reportIncident({ type: 'retraso', orderId: 'o1', minutes: 10 })).resolves.toBe(
      'Incidencia reportada.',
    );
    expect(post).toHaveBeenCalledWith('cocina/incidencias', {
      tipo: 'retraso',
      ordenId: 'o1',
      mensaje: undefined,
      minutos: 10,
    });
    await expect(
      r.reportWaste({ productId: 31, quantity: 1, reason: 'derrame', justification: 'Se cayó' }),
    ).resolves.toBe('Merma registrada.');
    expect(post).toHaveBeenLastCalledWith('inventario/mermas', {
      productId: 31,
      productName: undefined,
      quantity: 1,
      unit: undefined,
      reason: 'derrame',
      justification: 'Se cayó',
    });

    const forbidden = jest.fn().mockRejectedValue(new AppError('forbidden', 'Forbidden resource', 403));
    await expect(repo({ get: forbidden }).listProducts()).rejects.toThrow('Solo cocina y administración');
    await expect(
      repo({ post: forbidden }).reportWaste({
        productId: 1,
        quantity: 1,
        reason: 'otro',
        justification: 'xyz',
      }),
    ).rejects.toThrow('Solo cocina y administración');
    const offline = new Error('offline');
    await expect(repo({ get: jest.fn().mockRejectedValue(offline) }).listProducts()).rejects.toBe(offline);
  });
});

describe('Pantallas de cocina', () => {
  function setup(role: Role, overrides: Partial<Dependencies> = {}) {
    const deps = makeTestDependencies({
      listActiveOrdersUseCase: {
        execute: jest
          .fn()
          .mockResolvedValue([makeActiveOrder({ id: 'a', place: 'Mesa 5', status: 'en_preparacion' })]),
      },
      getOrderDetailUseCase: {
        execute: jest.fn().mockResolvedValue(makeOrderDetail({ status: 'en_preparacion' })),
      },
      ...overrides,
    });
    const session = makeSession();
    session.user.role = role;
    deps.sessionStore.getState().setSession(session);
    return deps;
  }

  const render = (deps: Dependencies) =>
    renderWithProviders(
      <NavigationContainer>
        <OrdersNavigator />
      </NavigationContainer>,
      deps,
    );

  it('cocina reporta un retraso desde el pedido y el piso lo ve en la tarjeta', async () => {
    const listIncidents = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: '9', orderId: 'a', type: 'retraso', minutes: 15, reportedBy: 'Diego' }]);
    const report = jest.fn().mockResolvedValue('Se avisó del retraso al personal de piso.');
    const deps = setup('cocina', {
      listIncidentsUseCase: { execute: listIncidents },
      reportIncidentUseCase: { execute: report },
    });
    await render(deps);

    await fireEvent.press(await screen.findByRole('button', { name: /^Mesa 5, Preparando/ }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Reportar un problema' }));
    expect(await screen.findByText('Pedido de Mesa 5')).toBeOnTheScreen();
    expect(screen.getByRole('radio', { name: 'Retraso' })).toBeSelected();

    await fireEvent.press(screen.getByRole('radio', { name: '15 minutos más' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Enviar reporte' }));

    await waitFor(() =>
      expect(report).toHaveBeenCalledWith({ type: 'retraso', orderId: 'a', minutes: 15, message: '' }),
    );
    // Regresa al detalle, que ya muestra el aviso.
    expect(await screen.findByText('Retraso de 15 min · Diego')).toBeOnTheScreen();
  });

  it('registra una merma de un producto del inventario con su costo', async () => {
    const report = jest.fn().mockResolvedValue('Merma registrada. Quedan 3.500 kg en inventario.');
    const deps = setup('cocina', {
      listInventoryProductsUseCase: { execute: jest.fn().mockResolvedValue([aguacate, crema]) },
      reportWasteUseCase: { execute: report },
      listWasteTodayUseCase: { execute: jest.fn().mockResolvedValue([]) },
    });
    await render(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Incidencias y mermas' }));
    expect(await screen.findByText('Sin incidencias hoy.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar merma' }));

    await fireEvent.changeText(await screen.findByLabelText('Buscar producto'), 'agua');
    await fireEvent.press(await screen.findByRole('button', { name: 'Aguacate, 5 kg en inventario' }));
    expect(screen.getByText('Aguacate')).toBeOnTheScreen();
    await fireEvent.changeText(screen.getByLabelText('Cantidad perdida'), '1.5');
    expect(screen.getByLabelText('Costo estimado $180.00')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('radio', { name: 'Derrame' }));
    await fireEvent.changeText(screen.getByLabelText('Justificación'), 'Se cayó la caja');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar merma' }));

    await waitFor(() =>
      expect(report).toHaveBeenCalledWith({
        productId: 31,
        productName: undefined,
        quantity: 1.5,
        unit: undefined,
        reason: 'derrame',
        justification: 'Se cayó la caja',
      }),
    );
  });

  it('una merma fuera del inventario y el error del API', async () => {
    const report = jest
      .fn()
      .mockRejectedValue(new AppError('validation', 'Ese producto no está en el inventario.'));
    const deps = setup('admin', {
      listInventoryProductsUseCase: { execute: jest.fn().mockResolvedValue([]) },
      reportWasteUseCase: { execute: report },
      listWasteTodayUseCase: {
        execute: jest
          .fn()
          .mockResolvedValue([
            {
              id: 1,
              productName: 'Crema',
              quantity: 2,
              unit: 'lt',
              reason: 'caducado',
              justification: 'Vencida',
              cost: 120,
            },
          ]),
      },
      listIncidentsUseCase: {
        execute: jest
          .fn()
          .mockResolvedValue([
            { id: '3', type: 'equipo', message: 'Horno', table: undefined, at: '2026-10-28T20:00:00Z' },
          ]),
      },
    });
    await render(deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Incidencias y mermas' }));
    expect(await screen.findByText('2 lt de Crema')).toBeOnTheScreen();
    expect(screen.getByText('Falla de equipo · Horno')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar merma' }));

    await fireEvent.changeText(await screen.findByLabelText('Producto fuera del inventario'), 'Salsa verde');
    await fireEvent.changeText(screen.getByLabelText('Cantidad perdida'), '2');
    await fireEvent.changeText(screen.getByLabelText('Unidad'), 'lt');
    await fireEvent.changeText(screen.getByLabelText('Justificación'), 'Se quemó');
    await fireEvent.press(screen.getByRole('button', { name: 'Registrar merma' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Ese producto no está en el inventario.');
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ productName: 'Salsa verde', unit: 'lt', quantity: 2 }),
    );
  });

  it('el mesero no ve el botón de reportes pero sí puede avisar de un problema del pedido', async () => {
    await render(setup('mesero'));
    expect(await screen.findByRole('button', { name: /^Mesa 5/ })).toBeOnTheScreen();
    expect(screen.queryByRole('button', { name: 'Incidencias y mermas' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: /^Mesa 5/ }));
    expect(await screen.findByRole('button', { name: 'Reportar un problema' })).toBeOnTheScreen();
  });

  it('el cajero no puede reportar problemas del pedido', async () => {
    await render(setup('cajero'));
    await fireEvent.press(await screen.findByRole('button', { name: /^Mesa 5/ }));
    await screen.findByText('Enchiladas suizas');
    expect(screen.queryByRole('button', { name: 'Reportar un problema' })).toBeNull();
  });
});
