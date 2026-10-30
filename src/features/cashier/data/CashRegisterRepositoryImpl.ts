import { AppError } from '../../../core/errors/AppError';
import type { HttpClient } from '../../../core/http/httpClient';
import { toIsoTimestamp } from '../../../shared/utils/apiDate';
import type { CashRegisterRepository, CashSession, CloseResult } from '../domain/CashRegister';

/** Turno de GET /caja/actual, POST /caja/abrir y /caja/cerrar; los montos llegan como string. */
export interface CashSessionDto {
  abierta: boolean;
  id?: number;
  fechaApertura?: string;
  fechaCierre?: string | null;
  fondoInicial?: string;
  efectivoVentas?: string;
  tarjetaVentas?: string;
  digitalVentas?: string;
  totalVentas?: string;
  propinas?: string;
  numPagos?: number;
  efectivoEsperado?: string;
  efectivoContado?: string | null;
  diferencia?: string | null;
}

const amount = (value: string | null | undefined) => {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function toCashSession(dto: CashSessionDto): CashSession {
  return {
    id: dto.id ?? 0,
    open: dto.abierta,
    openedAt: dto.fechaApertura ? toIsoTimestamp(dto.fechaApertura) : '',
    closedAt: dto.fechaCierre ? toIsoTimestamp(dto.fechaCierre) : undefined,
    openingFloat: amount(dto.fondoInicial),
    cashSales: amount(dto.efectivoVentas),
    cardSales: amount(dto.tarjetaVentas),
    digitalSales: amount(dto.digitalVentas),
    totalSales: amount(dto.totalVentas),
    tips: amount(dto.propinas),
    payments: dto.numPagos ?? 0,
    expectedCash: amount(dto.efectivoEsperado),
    countedCash: dto.efectivoContado != null ? amount(dto.efectivoContado) : undefined,
    difference: dto.diferencia != null ? amount(dto.diferencia) : undefined,
  };
}

/** 403 del RolesGuard y 409 de "ya tienes una caja abierta", en mensajes claros. */
function explain(error: unknown): unknown {
  if (error instanceof AppError && error.kind === 'forbidden') {
    return new AppError('forbidden', 'Solo caja puede abrir o cerrar turnos.', error.status);
  }
  return error;
}

export class CashRegisterRepositoryImpl implements CashRegisterRepository {
  constructor(private readonly http: HttpClient) {}

  async current(): Promise<CashSession | null> {
    try {
      const dto = await this.http.get<CashSessionDto>('caja/actual');
      return dto.abierta ? toCashSession(dto) : null;
    } catch (error) {
      throw explain(error);
    }
  }

  async open(openingFloat: number): Promise<CashSession> {
    try {
      const response = await this.http.post<{ caja: CashSessionDto }>('caja/abrir', {
        fondoInicial: openingFloat,
      });
      return toCashSession(response.caja);
    } catch (error) {
      throw explain(error);
    }
  }

  async close(countedCash: number, notes?: string): Promise<CloseResult> {
    try {
      const response = await this.http.post<{ message: string; caja: CashSessionDto }>('caja/cerrar', {
        efectivoContado: countedCash,
        notas: notes,
      });
      return { message: response.message || 'Caja cerrada.', session: toCashSession(response.caja) };
    } catch (error) {
      throw explain(error);
    }
  }
}
