import type { HttpClient } from '../../../../core/http/httpClient';
import type { CategoryWithDishesDto, DishDto } from '../dtos/MenuDto';

export class MenuRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  getCategoriesWithDishes(): Promise<CategoryWithDishesDto[]> {
    return this.http.get<CategoryWithDishesDto[]>('menu/categories/with-products');
  }

  /** PATCH /platillos/:id (solo administrador). */
  async updateDish(id: number, body: { disponible?: boolean; precio?: number }): Promise<void> {
    await this.http.patch(`platillos/${id}`, body);
  }

  getDish(id: number): Promise<DishDto> {
    return this.http.get<DishDto>(`menu/items/${id}`);
  }
}
