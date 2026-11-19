/** Empleados de la nómina (Fase 2): mismas reglas y mensajes que «Añadir a la nómina» en la web. */
export interface PayrollEmployee {
  id: string;
  name: string;
  role: string;
  weeklyPay: number;
  active: boolean;
}

export type EmployeeInput = Omit<PayrollEmployee, 'id'>;
export type EmployeeErrors = Partial<Record<'name' | 'role' | 'weeklyPay', string>>;

export interface PayrollEmployeesRepository {
  list(): Promise<PayrollEmployee[]>;
  create(input: EmployeeInput): Promise<void>;
  update(id: string, changes: Partial<EmployeeInput>): Promise<void>;
  remove(id: string): Promise<void>;
}

export function validateEmployee(input: EmployeeInput): EmployeeErrors {
  const e: EmployeeErrors = {};
  if (!input.name.trim()) e.name = 'Escribe el nombre.';
  if (!input.role.trim()) e.role = 'Escribe el puesto.';
  if (!(input.weeklyPay > 0)) e.weeklyPay = 'Escribe un pago mayor que cero.';
  return e;
}

export class EmployeeValidationError extends Error {
  constructor(readonly errors: EmployeeErrors) {
    super(Object.values(errors)[0] ?? 'Revisa los datos.');
  }
}

export class SaveEmployeeUseCase {
  constructor(private readonly repository: PayrollEmployeesRepository) {}

  async execute(input: EmployeeInput, id?: string): Promise<void> {
    const errors = validateEmployee(input);
    if (Object.keys(errors).length) throw new EmployeeValidationError(errors);
    const clean = { ...input, name: input.name.trim(), role: input.role.trim() };
    return id === undefined ? this.repository.create(clean) : this.repository.update(id, clean);
  }
}
