import type { HttpClient } from '../../../../core/http/httpClient';
import type { AdminPromotion, PromotionsRepository } from '../domain/Promotions';

interface PromotionDto {
  id: number;
  titulo: string;
  descripcion: string | null;
  badge: string | null;
  precioDescuento?: string | number | null;
  precio_descuento?: string | number | null;
  activa: boolean;
  fechaInicio?: string | null;
  fecha_inicio?: string | null;
  fechaFin?: string | null;
  fecha_fin?: string | null;
}

const num = (v: string | number | null | undefined) =>
  v === null || v === undefined || v === '' ? null : Number(v);

/** GET /promociones/admin y PATCH /promociones/:id (solo admin), como la web. */
export class PromotionsRepositoryImpl implements PromotionsRepository {
  constructor(private readonly http: HttpClient) {}

  async list(): Promise<AdminPromotion[]> {
    const rows = await this.http.get<PromotionDto[]>('promociones/admin');
    return rows.map((r) => ({
      id: r.id,
      title: r.titulo,
      description: r.descripcion,
      badge: r.badge,
      price: num(r.precioDescuento ?? r.precio_descuento),
      active: r.activa,
      startDate: r.fechaInicio ?? r.fecha_inicio ?? null,
      endDate: r.fechaFin ?? r.fecha_fin ?? null,
    }));
  }

  async setActive(id: number, active: boolean): Promise<void> {
    await this.http.patch(`promociones/${id}`, { activa: active });
  }
}
