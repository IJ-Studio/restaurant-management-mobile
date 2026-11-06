import { fireEvent, screen } from '@testing-library/react-native';

import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { makeDailyReport, makeDashboardSummary } from '../../../../features/admin/__fixtures__/dashboard';
import { DashboardScreen } from '../../../../features/admin/presentation/screens/DashboardScreen';
import { countOf, fromCalculationDto, partOf, recalculate, sumOf } from '../../../domain/Calculation';

describe('«Ver cálculo» (Prioridad 1.4)', () => {
  it('rehace suma, conteo y cociente desde el desglose', () => {
    const suma = fromCalculationDto({
      formula: 'a + b',
      datos: [
        { clave: 'a', valor: 0.1 },
        { clave: 'b', valor: 0.2 },
      ],
    })!;
    expect(suma.operation).toBe('suma');
    expect(recalculate(suma)).toBe(0.3);
    expect(recalculate(countOf('n', ['x', 'y', 'z'], (r) => r))).toBe(3);
    expect(
      recalculate({
        formula: 'a / b',
        operation: 'cociente',
        data: [
          { key: 'a', value: 12450.5 },
          { key: 'b', value: 28 },
        ],
      }),
    ).toBe(444.66);
    expect(
      recalculate(
        sumOf(
          's',
          [{ t: 48.5 }, { t: 320 }],
          (_, i) => `c${i}`,
          (r) => r.t,
        ),
      ),
    ).toBe(368.5);
    const parte = partOf(
      'efectivo',
      {
        formula: 't',
        operation: 'suma',
        data: [
          { key: 'efectivo', value: 800 },
          { key: 'tarjeta', value: 300 },
        ],
      },
      'efectivo',
    );
    expect(parte?.data).toEqual([{ key: 'efectivo', value: 800 }]);
  });

  it('el panel muestra el desglose de una tarjeta y cuadra con su cifra', async () => {
    const tips = {
      formula: 'propinas = suma',
      operation: 'suma' as const,
      data: [
        { key: 'Pago 1', value: 90 },
        { key: 'Pago 2', value: 30 },
      ],
    };
    const summary = makeDashboardSummary({ report: makeDailyReport({ calculations: { tips } }) });
    await renderWithProviders(
      <DashboardScreen />,
      makeTestDependencies({ getDashboardUseCase: { execute: jest.fn().mockResolvedValue(summary) } }),
    );

    await fireEvent.press(await screen.findByRole('button', { name: 'Ver cálculo de propinas' }));
    expect(screen.getByText('propinas = suma')).toBeOnTheScreen();
    expect(screen.getByText('Pago 1')).toBeOnTheScreen();
    expect(recalculate(tips)).toBe(summary.report!.sales.tips);
    // Las mesas ocupadas se cuentan con las mismas mesas del plano.
    await fireEvent.press(screen.getByRole('button', { name: 'Ver cálculo de mesas ocupadas' }));
    expect(screen.getByLabelText('Cálculo de mesas ocupadas')).toHaveTextContent(/Mesa 5/);
  });
});
