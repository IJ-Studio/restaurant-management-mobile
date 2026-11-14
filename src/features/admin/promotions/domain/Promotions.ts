/** Promociones en administración (paridad con la web): ver y activar o desactivar. */
export interface AdminPromotion {
  id: number;
  title: string;
  description: string | null;
  badge: string | null;
  price: number | null;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
}

export interface PromotionsRepository {
  list(): Promise<AdminPromotion[]>;
  setActive(id: number, active: boolean): Promise<void>;
}

/** «Del 1 nov al 30 nov», «Desde el 1 nov», «Hasta el 30 nov» o «Sin fechas». */
export function validity(p: Pick<AdminPromotion, 'startDate' | 'endDate'>): string {
  const day = (iso: string) => {
    const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };
  if (p.startDate && p.endDate) return `Del ${day(p.startDate)} al ${day(p.endDate)}`;
  if (p.startDate) return `Desde el ${day(p.startDate)}`;
  if (p.endDate) return `Hasta el ${day(p.endDate)}`;
  return 'Sin fechas';
}
