import type { HttpClient } from '../../../../core/http/httpClient';
import type {
  NewMovement,
  PayrollMovement,
  PayrollRepository,
  PayrollSummary,
  Period,
} from '../domain/Payroll';

interface SummaryDto {
  empleadoId: string;
  nombre: string | null;
  puesto: string | null;
  base: number;
  sumas: number;
  restas: number;
  neto: number;
  calculo: {
    formula: string;
    periodo?: { inicio: string; fin: string };
    datos: { clave: string; valor: number; origen?: string }[];
  };
}
interface MovementDto {
  id: number;
  empleado: string | null;
  tipo: 'suma' | 'resta';
  concepto: string;
  monto: number;
  fecha: string;
  justificacion: string;
  autor: string;
  corrigeId: number | null;
  corregidoPor: number | null;
}

const query = (p: Period) => `desde=${p.start}&hasta=${p.end}`;

/** GET /payroll/movimientos/resumen, GET y POST /payroll/movimientos y POST …/:id/corregir. */
export class PayrollRepositoryImpl implements PayrollRepository {
  constructor(private readonly http: HttpClient) {}

  async summary(period: Period): Promise<PayrollSummary[]> {
    const rows = await this.http.get<SummaryDto[]>(`payroll/movimientos/resumen?${query(period)}`);
    return rows.map((r) => ({
      employeeId: r.empleadoId,
      name: r.nombre ?? '',
      role: r.puesto ?? '',
      base: r.base,
      additions: r.sumas,
      deductions: r.restas,
      net: r.neto,
      calculation: {
        formula: r.calculo.formula,
        period: r.calculo.periodo
          ? { start: r.calculo.periodo.inicio, end: r.calculo.periodo.fin }
          : undefined,
        data: r.calculo.datos.map((d) => ({ key: d.clave, value: d.valor, source: d.origen })),
      },
    }));
  }

  async movements(period: Period): Promise<PayrollMovement[]> {
    const page = await this.http.get<{ movimientos: MovementDto[] }>(`payroll/movimientos?${query(period)}`);
    return page.movimientos.map((m) => ({
      id: m.id,
      employee: m.empleado ?? '',
      type: m.tipo,
      concept: m.concepto,
      amount: m.monto,
      date: m.fecha,
      justification: m.justificacion,
      author: m.autor,
      correctsId: m.corrigeId,
      correctedBy: m.corregidoPor,
    }));
  }

  async add(m: NewMovement): Promise<void> {
    await this.http.post('payroll/movimientos', {
      empleadoId: m.employeeId,
      tipo: m.type,
      concepto: m.concept,
      monto: m.amount,
      periodoInicio: m.period.start,
      periodoFin: m.period.end,
      justificacion: m.justification,
    });
  }

  async correct(id: number, justification: string): Promise<void> {
    await this.http.post(`payroll/movimientos/${id}/corregir`, { justificacion: justification });
  }
}
