import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { HttpClient } from '../../../../core/http/httpClient';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { StockScreen } from '../../stock/presentation/StockScreen';
import { PromotionsRepositoryImpl } from '../data/PromotionsRepositoryImpl';
import { validity, type PromotionsRepository } from '../domain/Promotions';
import { PromotionsScreen } from '../presentation/PromotionsScreen';

describe('promociones del admin (paridad con la web)', () => {
  it('repositorio: lee camelCase o snake_case y activa con PATCH', async () => {
    const http = {
      get: jest.fn().mockResolvedValue([
        {
          id: 1,
          titulo: 'CAJITA KIDS',
          descripcion: null,
          badge: 'Paquete',
          precioDescuento: '200.00',
          activa: true,
          fechaInicio: null,
          fechaFin: '2026-11-30',
        },
        {
          id: 2,
          titulo: 'X',
          descripcion: 'd',
          badge: null,
          precio_descuento: null,
          activa: false,
          fecha_inicio: '2026-11-01',
          fecha_fin: null,
        },
      ]),
      patch: jest.fn().mockResolvedValue({}),
    };
    const r = new PromotionsRepositoryImpl(http as unknown as HttpClient);
    const list = await r.list();
    expect(list[0]).toMatchObject({ title: 'CAJITA KIDS', price: 200, active: true, endDate: '2026-11-30' });
    expect(list[1]).toMatchObject({ price: null, startDate: '2026-11-01', endDate: null });
    await r.setActive(2, true);
    expect(http.get).toHaveBeenCalledWith('promociones/admin');
    expect(http.patch).toHaveBeenCalledWith('promociones/2', { activa: true });
  });

  it('vigencia en palabras', () => {
    expect(validity({ startDate: null, endDate: null })).toBe('Sin fechas');
    expect(validity({ startDate: '2026-11-01', endDate: null })).toMatch(/^Desde el 1/);
    expect(validity({ startDate: '2026-11-01', endDate: '2026-11-30' })).toMatch(/^Del 1 .* al 30 /);
  });

  it('pantalla: desactiva una promoción activa', async () => {
    const repo: jest.Mocked<PromotionsRepository> = {
      list: jest
        .fn()
        .mockResolvedValue([
          {
            id: 1,
            title: 'CAJITA KIDS',
            description: null,
            badge: 'Paquete',
            price: 200,
            active: true,
            startDate: null,
            endDate: null,
          },
        ]),
      setActive: jest.fn().mockResolvedValue(undefined),
    };
    await renderWithProviders(<PromotionsScreen />, makeTestDependencies({ promotionsRepository: repo }));
    await fireEvent.press(await screen.findByLabelText('Desactivar «CAJITA KIDS»'));
    await waitFor(() => expect(repo.setActive).toHaveBeenCalledWith(1, false));
    expect(await screen.findByText('«CAJITA KIDS» ya no se muestra.')).toBeOnTheScreen();
  });
});

describe('existencias del admin', () => {
  it('primero lo que está en su mínimo, con «Bajo» y «Bien»', async () => {
    const product = (id: number, name: string, stock: number, minStock: number) => ({
      id,
      name,
      category: '',
      unit: 'kg',
      stock,
      minStock,
      costPerUnit: 1,
    });
    const execute = jest
      .fn()
      .mockResolvedValue([
        product(1, 'Aguacate', 10, 2),
        product(2, 'Tortilla', 1, 5),
        product(3, 'Sal', 3, 0),
      ]);
    await renderWithProviders(
      <StockScreen />,
      makeTestDependencies({ listInventoryProductsUseCase: { execute } }),
    );
    expect(
      await screen.findByText(
        '1 en su mínimo o por debajo, de 3 productos. Las entradas y los proveedores se registran en la web.',
      ),
    ).toBeOnTheScreen();
    const names = screen.getAllByText(/^(Aguacate|Tortilla|Sal)$/).map((n) => n.props.children);
    expect(names).toEqual(['Tortilla', 'Aguacate', 'Sal']);
    expect(screen.getByText('Bajo')).toBeOnTheScreen();
    expect(screen.getByText('Bien')).toBeOnTheScreen();
  });
});
