import { cash, debit } from '../../__fixtures__/orders';
import {
  chargeSummary,
  equalShare,
  itemsAmount,
  parseAmount,
  tipFromPercent,
  validateCharge,
} from '../entities/Payment';

describe('tipFromPercent', () => {
  it('redondea a centavos', () => {
    expect(tipFromPercent(336, 10)).toBe(33.6);
    expect(tipFromPercent(145.55, 15)).toBe(21.83);
    expect(tipFromPercent(100, 0)).toBe(0);
  });
});

describe('chargeSummary', () => {
  it('en efectivo calcula el cambio o lo que falta, sin errores de punto flotante', () => {
    expect(chargeSummary(0.1, 0.2, cash, 0.3)).toEqual({ toPay: 0.3, change: 0 });
    expect(chargeSummary(336, 34, cash, 500)).toEqual({ toPay: 370, change: 130 });
    expect(chargeSummary(336, 34, cash, 300)).toEqual({ toPay: 370, missing: 70 });
  });

  it('con tarjeta no hay cambio; si el método no acepta propina no la suma', () => {
    expect(chargeSummary(336, 34, debit, 500)).toEqual({ toPay: 370 });
    expect(chargeSummary(336, 34, { ...debit, allowsTip: false })).toEqual({ toPay: 336 });
    expect(chargeSummary(336, 0, cash, Number.NaN)).toEqual({ toPay: 336 });
  });
});

describe('validateCharge', () => {
  it('pide método, importe y propina válida', () => {
    expect(validateCharge(336, { methodId: 0, tip: 0 }, undefined)).toBe('Elige cómo paga el cliente.');
    expect(validateCharge(0, { methodId: 2, tip: 0 }, debit)).toBe('El pedido no tiene importe por cobrar.');
    expect(validateCharge(336, { methodId: 2, tip: -1 }, debit)).toBe('La propina no es válida.');
  });

  it('en efectivo exige lo recibido y que alcance', () => {
    expect(validateCharge(336, { methodId: 1, tip: 0 }, cash)).toBe('Escribe con cuánto pagó el cliente.');
    expect(validateCharge(336, { methodId: 1, tip: 34, received: 350 }, cash)).toBe(
      'El efectivo no alcanza: faltan $20.00.',
    );
    expect(validateCharge(336, { methodId: 1, tip: 34, received: 370 }, cash)).toBeNull();
  });

  it('con tarjeta basta el método; la referencia no puede ser enorme', () => {
    expect(validateCharge(336, { methodId: 2, tip: 0 }, debit)).toBeNull();
    expect(validateCharge(336, { methodId: 2, tip: 0, reference: 'x'.repeat(101) }, debit)).toBe(
      'La referencia es demasiado larga.',
    );
  });
});

describe('parseAmount', () => {
  it('acepta montos con comas, signo y hasta 2 decimales', () => {
    expect(parseAmount('1,250.50')).toBe(1250.5);
    expect(parseAmount(' $300 ')).toBe(300);
    expect(parseAmount('12.')).toBe(12);
    expect(parseAmount('12.345')).toBeNaN();
    expect(parseAmount('abc')).toBeNaN();
    expect(parseAmount('')).toBeNaN();
  });
});

describe('cuenta separada', () => {
  it('reparte en partes iguales y la última persona paga el ajuste de centavos', () => {
    // $100 entre 3: 33.33 + 33.33 + 33.34
    expect(equalShare(100, 3)).toBe(33.33);
    expect(equalShare(66.67, 2)).toBe(33.34);
    expect(equalShare(33.34, 1)).toBe(33.34);
    expect(equalShare(50, 0)).toBe(50);
  });

  it('suma los platillos elegidos sin errores de punto flotante', () => {
    expect(
      itemsAmount([
        { unitPrice: 145.5, quantity: 2 },
        { unitPrice: 0.1, quantity: 3 },
      ]),
    ).toBe(291.3);
    expect(itemsAmount([])).toBe(0);
  });
});
