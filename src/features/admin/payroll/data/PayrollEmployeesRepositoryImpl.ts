import type { HttpClient } from '../../../../core/http/httpClient';
import type { EmployeeInput, PayrollEmployee, PayrollEmployeesRepository } from '../domain/Employees';

/** GET/POST /payroll, PATCH y DELETE /payroll/:id (solo admin), los mismos cuerpos que la web. */
export class PayrollEmployeesRepositoryImpl implements PayrollEmployeesRepository {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<PayrollEmployee[]> {
    const rows = await this.http.get<PayrollEmployee[]>('payroll');
    return rows.map((r) => ({
      id: String(r.id),
      name: r.name,
      role: r.role,
      weeklyPay: Number(r.weeklyPay),
      active: r.active,
    }));
  }

  async create(input: EmployeeInput): Promise<void> {
    await this.http.post('payroll', input);
  }

  async update(id: string, changes: Partial<EmployeeInput>): Promise<void> {
    await this.http.patch(`payroll/${id}`, changes);
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(`payroll/${id}`);
  }
}
