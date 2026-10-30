import { render, screen } from '@testing-library/react-native';

import { activeHours, BreakdownBars, HourlyBars } from '../Charts';

const money = (value: number) => `$${value}`;

function hours(entries: Record<number, number>): number[] {
  const values = Array.from({ length: 24 }, () => 0);
  for (const [hour, value] of Object.entries(entries)) values[Number(hour)] = value;
  return values;
}

describe('activeHours', () => {
  it('va de la primera a la última hora con ventas', () => {
    expect(activeHours(hours({ 9: 10, 18: 5 }))).toEqual([9, 10, 11, 12, 13, 14, 15, 16, 17, 18]);
  });

  it('con pocas horas completa al menos seis alrededor', () => {
    expect(activeHours(hours({ 14: 10 }))).toEqual([11, 12, 13, 14, 15, 16]);
    expect(activeHours(hours({ 0: 10 }))).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it('sin ventas no hay horas', () => {
    expect(activeHours(hours({}))).toEqual([]);
  });
});

describe('HourlyBars', () => {
  it('anuncia la hora pico y rotula cada hora', async () => {
    await render(<HourlyBars values={hours({ 13: 450, 14: 800 })} format={money} />);

    expect(screen.getByLabelText('Ventas por hora. Hora con más ventas: 2pm, $800.')).toBeOnTheScreen();
    expect(screen.getByText('Hora pico 2pm · $800')).toBeOnTheScreen();
  });

  it('sin ventas muestra el mensaje', async () => {
    await render(<HourlyBars values={hours({})} format={money} emptyMessage="Nada hoy." />);
    expect(screen.getByText('Nada hoy.')).toBeOnTheScreen();
  });
});

describe('BreakdownBars', () => {
  it('cada fila dice valor, porcentaje y detalle', async () => {
    await render(
      <BreakdownBars
        items={[
          { label: 'Efectivo', value: 300, detail: '3 cobros' },
          { label: 'Tarjeta', value: 100 },
        ]}
        format={money}
        showPercent
        avatars
      />,
    );

    expect(screen.getByLabelText('Efectivo, $300, 75%, 3 cobros')).toBeOnTheScreen();
    expect(screen.getByLabelText('Tarjeta, $100, 25%')).toBeOnTheScreen();
    expect(screen.getByText('E')).toBeOnTheScreen();
  });

  it('sin filas muestra el mensaje', async () => {
    await render(<BreakdownBars items={[]} format={money} emptyMessage="Sin cobros." />);
    expect(screen.getByText('Sin cobros.')).toBeOnTheScreen();
  });
});
