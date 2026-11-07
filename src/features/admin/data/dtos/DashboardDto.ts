/** GET /dashboard/admin/stats */
export interface AdminStatsDto {
  totalVentas: number | string | null;
  pedidosPendientes: number | null;
  pedidosEnPreparacion: number | null;
  /** Versiones anteriores del API no los mandan. */
  pedidosListos?: number | null;
  pedidosPorCobrar?: number | null;
  mesasOcupadas: number | null;
  mesasLibres: number | null;
  totalMesas: number | null;
}

/** GET /reportes/hoy — los montos llegan como string con 2 decimales. */
export interface DailyReportDto {
  ventas: {
    cobrado: string;
    propinas: string;
    pagos: number;
    ordenesPagadas: number;
    ticketPromedio: string;
    comensales: number;
  };
  pedidos: { total: number; porEstatus: Record<string, number> };
  porMetodo: { metodo: string; total: string; pagos: number }[];
  porCajero: { nombre: string; total: string; pagos: number }[];
  porMesero: { nombre: string; pedidos: number; total: string; comensales: number }[];
  porHora: number[];
  topPlatillos: { nombre: string; cantidad: number; total: string }[];
  ultimosCobros: {
    ordenId: string;
    mesa: string | null;
    monto: string;
    propina: string;
    metodo: string | null;
    cajero: string | null;
    creadoEn: string | null;
  }[];
  incidencias: {
    id: string;
    ordenId: string | null;
    tipo: string;
    mensaje: string | null;
    minutos: number | null;
    mesa: string | null;
    reportadoPor: string | null;
    creadoEn: string | null;
  }[];
  mermas: { registros: number; costo: string };
  cajasAbiertas: { id: number; cajero: string | null; desde: string | null }[];
}

/** Fila de GET /reservations/map: mesa activa y si tiene reservación en las próximas 2 horas. */
export interface TableMapDto {
  id: number;
  numero: string;
  capacidad: number;
  areaNombre: string | null;
  /** "ocupada" (reservada en las próximas 2 h) o "disponible". */
  estado: string;
  [extra: string]: unknown;
}
