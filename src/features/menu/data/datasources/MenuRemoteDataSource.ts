import type { HttpClient } from '../../../../core/http/httpClient';
import type { CategoryWithDishesDto, DishDto } from '../dtos/MenuDto';

export class MenuRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  getCategoriesWithDishes(): Promise<CategoryWithDishesDto[]> {
    return this.http.get<CategoryWithDishesDto[]>('menu/categories/with-products');
  }

  getDish(id: number): Promise<DishDto> {
    return this.http.get<DishDto>(`menu/items/${id}`);
  }
}
