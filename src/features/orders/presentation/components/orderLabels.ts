import type { StatusTone } from '../../../../shared/presentation/components/StatusBadge';
import type { OrderAction } from '../../domain/entities/ActiveOrder';
import type { OrderStep } from '../../domain/repositories/OrderRepository';

const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  pendiente: { label: 'Por confirmar', tone: 'warning' },
  abierta: { label: 'En cocina', tone: 'brand' },
  en_preparacion: { label: 'Preparando', tone: 'info' },
  lista: { label: 'Lista para servir', tone: 'success' },
  entregada: { label: 'Por cobrar', tone: 'warning' },
  para_cobrar: { label: 'Por cobrar', tone: 'warning' },
  pagada: { label: 'Pagada', tone: 'success' },
  completada: { label: 'Completada', tone: 'neutral' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

export function orderStatusLabel(status: string): string {
  return STATUS[status]?.label ?? status;
}

export function orderStatusTone(status: string): StatusTone {
  return STATUS[status]?.tone ?? 'neutral';
}

/** Pasos que se hacen con un toque (cocina y piso) y el estatus al que llevan. */
export const STEP_FOR: Partial<Record<OrderAction, OrderStep>> = {
  start: 'en_preparacion',
  ready: 'lista',
  deliver: 'entregada',
};

export const ACTION_LABEL: Record<OrderAction, string> = {
  confirm: 'Confirmar y enviar a cocina',
  'remove-item': 'Quitar',
  cancel: 'Cancelar pedido',
  start: 'Empezar a preparar',
  ready: 'Marcar como lista',
  deliver: 'Entregar en la mesa',
  charge: 'Cobrar',
};
