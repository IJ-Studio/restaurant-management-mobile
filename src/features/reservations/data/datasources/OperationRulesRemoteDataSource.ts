import type { HttpClient } from '../../../../core/http/httpClient';
import type { OperationRules } from '../../domain/entities/OperationRules';

/** Respuesta de GET /reglas. */
export interface OperationRulesDto {
  utcOffsetMin: number;
  aceptaReservas: boolean;
  reservas: { anticipacionMin: number; margenCierreMin: number; comensalesMax: number };
  pedidos: { cantidadMaxPorPlatillo: number };
  horario: {
    dia: number;
    apertura: string | null;
    cierre: string | null;
    cocinaCierre: string | null;
    cerrado: boolean;
  }[];
  diasEspeciales: { fecha: string; cerrado: boolean; apertura: string | null; cierre: string | null }[];
}

export function toOperationRules(dto: OperationRulesDto): OperationRules {
  return {
    utcOffsetMin: dto.utcOffsetMin,
    acceptsReservations: dto.aceptaReservas,
    minAdvanceMin: dto.reservas.anticipacionMin,
    closingMarginMin: dto.reservas.margenCierreMin,
    maxPartySize: dto.reservas.comensalesMax,
    maxQuantityPerDish: dto.pedidos.cantidadMaxPorPlatillo,
    schedule: dto.horario.map((d) => ({
      day: d.dia,
      opens: d.apertura,
      closes: d.cierre,
      kitchenCloses: d.cocinaCierre,
      closed: d.cerrado,
    })),
    specialDays: dto.diasEspeciales.map((d) => ({
      date: d.fecha,
      closed: d.cerrado,
      opens: d.apertura,
      closes: d.cierre,
    })),
  };
}

/** Las reglas de operación centralizadas del API (Fase 3). */
export class OperationRulesRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  async get(): Promise<OperationRules> {
    return toOperationRules(await this.http.get<OperationRulesDto>('reglas'));
  }
}
