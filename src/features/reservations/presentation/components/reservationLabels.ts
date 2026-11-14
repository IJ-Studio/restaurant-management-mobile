import type { Reservation } from '../../domain/entities/Reservation';

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
  no_show: 'No se presentó',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

export function reservationSummary(reservation: Reservation): string {
  const people = `${reservation.partySize} ${reservation.partySize === 1 ? 'persona' : 'personas'}`;
  const table = reservation.tableId ? `Mesa ${reservation.tableId}` : 'Sin mesa';
  return [people, table, statusLabel(reservation.status)].join(' · ');
}

/** Estados que el administrador puede elegir, en el orden de la web. */
export const STATUS_OPTIONS = ['pendiente', 'confirmada', 'completada', 'cancelada', 'no_show'] as const;
