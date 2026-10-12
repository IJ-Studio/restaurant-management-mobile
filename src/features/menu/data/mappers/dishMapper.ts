import type { Dish } from '../../domain/entities/Dish';
import type { DishDto } from '../dtos/DishDto';

/** Solo se cargan imágenes por HTTPS (MASVS-NETWORK). */
function safeImageUrl(url: string | null | undefined): string | null {
  return typeof url === 'string' && url.startsWith('https://') ? url : null;
}

function toPrice(value: string | number): number {
  const price = typeof value === 'number' ? value : Number.parseFloat(value);
  return Number.isFinite(price) ? price : 0;
}

/** Convierte el DTO en entidad y descarta lo que la app no usa (p. ej. `precioCosto`). */
export function toDish(dto: DishDto): Dish {
  const description = dto.descripcion?.trim() ?? '';
  return {
    id: String(dto.id),
    categoryId: dto.categoriaId == null ? null : String(dto.categoriaId),
    name: dto.nombre,
    description,
    shortDescription: dto.descripcionCorta?.trim() || description,
    imageUrl: safeImageUrl(dto.imagenUrl),
    price: toPrice(dto.precio),
    prepTimeMinutes: dto.tiempoPreparacion ?? null,
    // Si el API no dice nada, se asume disponible (es el default de la tabla).
    available: dto.disponible !== false,
    tags: {
      vegetarian: !!dto.esVegetariano,
      vegan: !!dto.esVegano,
      glutenFree: !!dto.esSinGluten,
      spicy: !!dto.esPicante,
      spicyLevel: dto.nivelPicante ?? 0,
      popular: !!dto.esPopular,
      isNew: !!dto.esNuevo,
      chefSpecial: !!dto.esDelChef,
    },
  };
}
