import type { StatusTone } from '../../../../shared/presentation/components/StatusBadge';

const STATUS: Record<string, { label: string; tone: StatusTone }> = {
  pendiente: { label: 'Por confirmar', tone: 'warning' },
  abierta: { label: 'En cocina', tone: 'brand' },
  pagada: { label: 'Pagada', tone: 'success' },
  entregada: { label: 'Entregada', tone: 'success' },
  completada: { label: 'Completada', tone: 'neutral' },
  cancelada: { label: 'Cancelada', tone: 'danger' },
};

export function orderStatusLabel(status: string): string {
  return STATUS[status]?.label ?? status;
}

export function orderStatusTone(status: string): StatusTone {
  return STATUS[status]?.tone ?? 'neutral';
}
