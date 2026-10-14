export type DishTag = 'vegetariano' | 'vegano' | 'sin-gluten' | 'picante' | 'popular' | 'nuevo' | 'del-chef';

export interface Dish {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  shortDescription?: string;
  imageUrl?: string;
  /** Precio de venta en MXN. */
  price: number;
  prepTimeMinutes?: number;
  available: boolean;
  tags: DishTag[];
  /** 1–5, solo si el platillo es picante. */
  spicyLevel?: number;
}

export interface MenuCategory {
  id: number;
  name: string;
  dishes: Dish[];
}
