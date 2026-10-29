/** Turno de caja del cajero (tabla `cierres_caja`). */
export interface CashSession {
  id: number;
  open: boolean;
  /** ISO 8601. */
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  cashSales: number;
  cardSales: number;
  digitalSales: number;
  totalSales: number;
  tips: number;
  payments: number;
  /** Fondo + efectivo cobrado + propinas en efectivo: lo que debe haber al cerrar. */
  expectedCash: number;
  countedCash?: number;
  difference?: number;
}

export interface CloseResult {
  message: string;
  session: CashSession;
}

export interface CashRegisterRepository {
  /** Turno abierto del usuario, o null si no tiene. */
  current(): Promise<CashSession | null>;
  open(openingFloat: number): Promise<CashSession>;
  close(countedCash: number, notes?: string): Promise<CloseResult>;
}

/** Diferencia entre lo contado y lo esperado, en centavos para no arrastrar errores. */
export function cashDifference(expected: number, counted: number): number {
  return (Math.round(counted * 100) - Math.round(expected * 100)) / 100;
}

export function differenceLabel(difference: number): string {
  if (difference === 0) return 'Cuadra';
  return difference > 0 ? `Sobran $${difference.toFixed(2)}` : `Faltan $${(-difference).toFixed(2)}`;
}

/** Casos de uso del corte. Validan antes de llamar al API. */
export class GetCashSessionUseCase {
  constructor(private readonly repository: CashRegisterRepository) {}

  execute(): Promise<CashSession | null> {
    return this.repository.current();
  }
}

export class OpenCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRepository) {}

  async execute(openingFloat: number): Promise<CashSession> {
    if (!Number.isFinite(openingFloat) || openingFloat < 0) {
      throw new Error('Escribe el fondo inicial (puede ser 0).');
    }
    return this.repository.open(Math.round(openingFloat * 100) / 100);
  }
}

export class CloseCashRegisterUseCase {
  constructor(private readonly repository: CashRegisterRepository) {}

  async execute(countedCash: number, notes?: string): Promise<CloseResult> {
    if (!Number.isFinite(countedCash) || countedCash < 0) {
      throw new Error('Escribe cuánto efectivo contaste en la caja.');
    }
    return this.repository.close(Math.round(countedCash * 100) / 100, notes?.trim() || undefined);
  }
}
