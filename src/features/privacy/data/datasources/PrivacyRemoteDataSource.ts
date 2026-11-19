import type { HttpClient } from '../../../../core/http/httpClient';

/** Respuesta de GET y PUT /profile/privacidad. */
export interface PrivacyDto {
  avisoPrivacidad: { aceptado: boolean; version: string | null; fecha: string | null };
  notificacionesPush: boolean;
  reportesErrores: boolean;
}

/** Cuerpo de PUT /profile/privacidad: el API registra solo los campos enviados. */
export interface PrivacyChangesDto {
  avisoPrivacidad?: { aceptado: boolean; version: string };
  notificacionesPush?: boolean;
  reportesErrores?: boolean;
}

export class PrivacyRemoteDataSource {
  constructor(private readonly http: HttpClient) {}

  get(): Promise<PrivacyDto> {
    return this.http.get<PrivacyDto>('profile/privacidad');
  }

  update(changes: PrivacyChangesDto): Promise<PrivacyDto> {
    return this.http.put<PrivacyDto>('profile/privacidad', { origen: 'movil', ...changes });
  }

  async deleteAccount(password: string): Promise<void> {
    await this.http.delete('account', { password });
  }
}
