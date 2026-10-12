import type { HttpClient } from '../../../../core/http/httpClient';
import type { CreateReservationRequestDto, ReservationDto } from '../dtos/ReservationDto';

export class ReservationRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  create(body: CreateReservationRequestDto): Promise<ReservationDto> {
    return this.http.post<ReservationDto>('reservations', body);
  }

  listFrom(from: Date): Promise<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(`reservations?fechaDesde=${encodeURIComponent(from.toISOString())}`);
  }
}
