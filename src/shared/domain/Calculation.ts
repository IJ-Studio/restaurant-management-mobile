/**
 * «Ver cálculo» (Prioridad 1.4): fórmula, operación y cada dato usado para una cifra. Viene del API
 * (`calculos`) o se arma con las mismas filas que dieron la cifra; nunca con otros datos.
 * `suma`: suma de los valores · `conteo`: número de datos · `cociente`: el primero entre el segundo.
 */
export type CalculationOperation = 'suma' | 'conteo' | 'cociente';

export interface Calculation {
  formula: string;
  operation: CalculationOperation;
  data: { key: string; value: number | string; source?: string }[];
  period?: { start: string; end: string };
  filters?: Record<string, string | number | boolean | null>;
}

/** Forma en que la devuelve el API. */
export interface CalculationDto {
  formula: string;
  operacion?: CalculationOperation;
  datos: { clave: string; valor: number | string; origen?: string }[];
  periodo?: { inicio: string; fin: string };
  filtros?: Record<string, string | number | boolean | null>;
}

export function fromCalculationDto(dto?: CalculationDto | null): Calculation | undefined {
  if (!dto) return undefined;
  return {
    formula: dto.formula,
    operation: dto.operacion ?? 'suma',
    data: dto.datos.map((d) => ({ key: d.clave, value: d.valor, source: d.origen })),
    period: dto.periodo ? { start: dto.periodo.inicio, end: dto.periodo.fin } : undefined,
    filters: dto.filtros,
  };
}

/** Cuántas filas cumplen: un dato por fila. */
export function countOf<T>(
  formula: string,
  rows: readonly T[],
  key: (row: T, i: number) => string,
  value: (row: T) => string = () => 'sí',
): Calculation {
  return { formula, operation: 'conteo', data: rows.map((r, i) => ({ key: key(r, i), value: value(r) })) };
}

/** Rehace el resultado desde el desglose (lo usan las pruebas). */
export function recalculate({ operation, data }: Calculation): number {
  if (operation === 'conteo') return data.length;
  const values = data.map((d) => Number(d.value));
  if (operation === 'cociente') return values[1] ? Math.round((values[0] / values[1]) * 100) / 100 : 0;
  return Math.round(values.reduce((s, v) => s + v * 100, 0)) / 100;
}

/** Suma de un valor por fila. */
export function sumOf<T>(
  formula: string,
  rows: readonly T[],
  key: (row: T, i: number) => string,
  value: (row: T) => number,
): Calculation {
  return {
    formula,
    operation: 'suma',
    data: rows.map((r, i) => ({ key: key(r, i), value: Math.round(value(r) * 100) / 100 })),
  };
}

/** Un solo dato de un desglose ya calculado (p. ej. «efectivo» del total cobrado). */
export function partOf(
  formula: string,
  calculation: Calculation | undefined,
  key: string,
): Calculation | undefined {
  const item = calculation?.data.find((d) => d.key === key);
  return item
    ? { formula, operation: 'suma', data: [item], period: calculation?.period, filters: calculation?.filters }
    : undefined;
}
