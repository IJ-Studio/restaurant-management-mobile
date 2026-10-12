/** Fila de `platillos` tal como la devuelve el API (numeric de Postgres llega como string). */
export interface DishDto {
  id: number;
  categoriaId: number;
  nombre: string;
  descripcion: string | null;
  descripcionCorta: string | null;
  imagenUrl: string | null;
  precio: string | number;
  tiempoPreparacion: number | null;
  disponible: boolean | null;
  esVegetariano: boolean | null;
  esVegano: boolean | null;
  esSinGluten: boolean | null;
  esPicante: boolean | null;
  nivelPicante: number | null;
  esPopular: boolean | null;
  esNuevo: boolean | null;
  esDelChef: boolean | null;
  orden: number | null;
  [extra: string]: unknown;
}

/** GET /menu/categories/with-products */
export interface CategoryWithDishesDto {
  id: number;
  nombre: string;
  orden: number | null;
  activa: boolean | null;
  platillos: DishDto[];
  [extra: string]: unknown;
}
