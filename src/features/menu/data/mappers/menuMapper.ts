import { AppError } from '../../../../core/errors/AppError';
import type { Dish, DishTag, MenuCategory } from '../../domain/entities/Dish';
import type { CategoryWithDishesDto, DishDto } from '../dtos/MenuDto';

const TAG_FLAGS: [keyof DishDto, DishTag][] = [
  ['esVegetariano', 'vegetariano'],
  ['esVegano', 'vegano'],
  ['esSinGluten', 'sin-gluten'],
  ['esPicante', 'picante'],
  ['esPopular', 'popular'],
  ['esNuevo', 'nuevo'],
  ['esDelChef', 'del-chef'],
];

const byOrder = (a: { orden: number | null }, b: { orden: number | null }) => (a.orden ?? 0) - (b.orden ?? 0);

/** Solo imágenes por HTTPS (MASVS-NETWORK); una URL insegura o inválida se descarta. */
function safeImageUrl(url: string | null): string | undefined {
  return url && /^https:\/\/\S+$/i.test(url) ? url : undefined;
}

/** Copia solo lo que usa la app: costo, notas de cocina y demás columnas internas no salen de aquí. */
export function toDish(dto: DishDto): Dish {
  const price = Number(dto.precio);
  if (!Number.isFinite(price)) throw new AppError('server', `Precio inválido en el platillo ${dto.id}.`);

  return {
    id: dto.id,
    categoryId: dto.categoriaId,
    name: dto.nombre,
    description: dto.descripcion ?? '',
    shortDescription: dto.descripcionCorta ?? undefined,
    imageUrl: safeImageUrl(dto.imagenUrl),
    price,
    prepTimeMinutes: dto.tiempoPreparacion ?? undefined,
    available: dto.disponible !== false,
    tags: TAG_FLAGS.filter(([flag]) => dto[flag] === true).map(([, tag]) => tag),
    spicyLevel: dto.esPicante && dto.nivelPicante ? dto.nivelPicante : undefined,
  };
}

export function toMenu(dtos: CategoryWithDishesDto[]): MenuCategory[] {
  return dtos
    .filter((category) => category.activa !== false)
    .sort(byOrder)
    .map((category) => ({
      id: category.id,
      name: category.nombre,
      dishes: [...(category.platillos ?? [])].sort(byOrder).map(toDish),
    }));
}
