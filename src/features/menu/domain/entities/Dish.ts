export interface DishTags {
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  spicy: boolean;
  /** 0 a 5; solo tiene sentido si `spicy`. */
  spicyLevel: number;
  popular: boolean;
  isNew: boolean;
  chefSpecial: boolean;
}

export interface Dish {
  id: string;
  categoryId: string | null;
  name: string;
  description: string;
  shortDescription: string;
  /** Solo URLs HTTPS; `null` si el platillo no tiene imagen. */
  imageUrl: string | null;
  /** En pesos (MXN). */
  price: number;
  prepTimeMinutes: number | null;
  available: boolean;
  tags: DishTags;
}
