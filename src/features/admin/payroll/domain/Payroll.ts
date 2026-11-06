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
