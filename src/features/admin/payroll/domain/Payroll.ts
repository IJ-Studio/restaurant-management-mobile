/** Sumas y restas a la nómina (Prioridad 3.1). Solo controla la nómina: no paga nada. */
export type MovementType = 'suma' | 'resta';

export const CONCEPTS: Record<string, string> = {
  bono: 'Bono',
  horas_extra: 'Horas extra',
  propina: 'Propina',
  reembolso: 'Reembolso',
  objeto_roto: 'Objeto roto',
  danio: 'Daño',
  reparacion: 'Reparación',
  consumo: 'Consumo',
  anticipo: 'Anticipo',
  faltante_caja: 'Faltante de caja',
  otro: 'Otro',
  correccion: 'Corrección',
};

export interface Calculation {
  formula: string;
  period?: { start: string; end: string };
  data: { key: string; value: number; source?: string }[];
}

export interface PayrollSummary {
  employeeId: string;
  name: string;
  role: string;
  base: number;
  additions: number;
  deductions: number;
  net: number;
  calculation: Calculation;
}

export interface PayrollMovement {
  id: number;
  employee: string;
  type: MovementType;
  concept: string;
  amount: number;
  date: string;
  justification: string;
  author: string;
  correctsId: number | null;
  correctedBy: number | null;
}

export interface Period {
  start: string;
  end: string;
}

export interface NewMovement {
  employeeId: string;
  type: MovementType;
  concept: string;
  amount: number;
  period: Period;
  justification: string;
}

export interface PayrollRepository {
  summary(period: Period): Promise<PayrollSummary[]>;
  movements(period: Period): Promise<PayrollMovement[]>;
  add(movement: NewMovement): Promise<void>;
  correct(id: number, justification: string): Promise<void>;
}

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Semana actual, de lunes a domingo (la misma que usa la web). */
export function currentWeek(today = new Date()): Period {
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { start: iso(monday), end: iso(sunday) };
}

/** Las mismas reglas que el API (justificación de 5 letras o más, monto positivo, concepto válido). */
export class AddPayrollMovementUseCase {
  constructor(private readonly repository: PayrollRepository) {}

  async execute(movement: NewMovement): Promise<void> {
    if (!(movement.amount > 0)) throw new Error('Escribe un monto mayor que cero.');
    if (movement.justification.trim().length < 5) throw new Error('Explica el motivo (al menos 5 letras).');
    if (!(movement.concept in CONCEPTS) || movement.concept === 'correccion')
      throw new Error('Elige un concepto.');
    return this.repository.add({
      ...movement,
      amount: Math.round(movement.amount * 100) / 100,
      justification: movement.justification.trim(),
    });
  }
}

export class CorrectPayrollMovementUseCase {
  constructor(private readonly repository: PayrollRepository) {}

  async execute(id: number, justification: string): Promise<void> {
    if (justification.trim().length < 5) throw new Error('Explica por qué se corrige (al menos 5 letras).');
    return this.repository.correct(id, justification.trim());
  }
}

/** Mueve el periodo `weeks` semanas (negativo hacia atrás), conservando su duración. */
export function shiftPeriod(period: Period, weeks: number): Period {
  const move = (s: string) => {
    const [y, m, d] = s.split('-').map(Number);
    return iso(new Date(y, m - 1, d + weeks * 7));
  };
  return { start: move(period.start), end: move(period.end) };
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;
const validDay = (s: string) => {
  if (!ISO_DAY.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  return iso(new Date(y, m - 1, d)) === s;
};

/** Periodo libre «Desde»/«Hasta» como en la web: fechas reales y en orden. */
export function parsePeriod(start: string, end: string): Period | { error: string } {
  const s = start.trim();
  const e = end.trim();
  if (!validDay(s) || !validDay(e)) return { error: 'Escribe las fechas como AAAA-MM-DD.' };
  if (s > e) return { error: 'La fecha «Desde» no puede ser posterior a «Hasta».' };
  return { start: s, end: e };
}
