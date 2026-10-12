import type { HttpClient } from '../../../../core/http/httpClient';
import type { DishDto } from '../dtos/DishDto';

export class MenuRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  getMenu(): Promise<DishDto[]> {
    return this.http.get<DishDto[]>('menu');
  }

  getDish(id: string): Promise<DishDto> {
    return this.http.get<DishDto>(`menu/items/${encodeURIComponent(id)}`);
  }
}
