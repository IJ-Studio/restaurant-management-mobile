/** Fila de `platillos` como la devuelve el API. `precio` llega como string (numeric de Postgres). */
export interface DishDto {
  id: number | string;
  categoriaId?: number | string | null;
  nombre: string;
  descripcion?: string | null;
  descripcionCorta?: string | null;
  imagenUrl?: string | null;
  precio: string | number;
  tiempoPreparacion?: number | null;
  disponible?: boolean | null;
  esVegetariano?: boolean | null;
  esVegano?: boolean | null;
  esSinGluten?: boolean | null;
  esPicante?: boolean | null;
  nivelPicante?: number | null;
  esPopular?: boolean | null;
  esNuevo?: boolean | null;
  esDelChef?: boolean | null;
  [key: string]: unknown;
}
