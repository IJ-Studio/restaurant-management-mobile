import type { HttpClient } from '../../../../core/http/httpClient';
import type {
  AvailabilityDto,
  CreateReservationRequestDto,
  CreateReservationResponseDto,
  ReservationDto,
} from '../dtos/ReservationDto';

export class ReservationRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  create(body: CreateReservationRequestDto): Promise<CreateReservationResponseDto> {
    return this.http.post<CreateReservationResponseDto>('reservations', body);
  }

  /** PATCH /reservations/:id (solo administrador). */
  async updateStatus(id: string, body: { estatus: string; motivoCancelacion?: string }): Promise<void> {
    await this.http.patch(`reservations/${encodeURIComponent(id)}`, body);
  }

  /** Mesas libres; `fecha` y `hora` en la hora del restaurante. */
  availability(fecha: string, hora: string, numComensales: number): Promise<AvailabilityDto> {
    const query = `fecha=${fecha}&hora=${encodeURIComponent(hora)}&numComensales=${numComensales}`;
    return this.http.get<AvailabilityDto>(`reservations/availability?${query}`);
  }

  listFrom(from: Date): Promise<ReservationDto[]> {
    return this.http.get<ReservationDto[]>(
      `reservations?fechaDesde=${encodeURIComponent(from.toISOString())}`,
    );
  }
}
