import type { PrivacyPreference, PrivacySettings } from '../../domain/entities/PrivacySettings';
import type { PrivacyRepository } from '../../domain/repositories/PrivacyRepository';
import type {
  PrivacyChangesDto,
  PrivacyDto,
  PrivacyRemoteDataSource,
} from '../datasources/PrivacyRemoteDataSource';

const FIELD_BY_PREFERENCE: Record<PrivacyPreference, keyof Omit<PrivacyChangesDto, 'avisoPrivacidad'>> = {
  pushNotifications: 'notificacionesPush',
  errorReports: 'reportesErrores',
};

export function toPrivacySettings(dto: PrivacyDto): PrivacySettings {
  return {
    noticeAccepted: dto.avisoPrivacidad.aceptado,
    noticeVersion: dto.avisoPrivacidad.version,
    noticeAcceptedAt: dto.avisoPrivacidad.fecha,
    pushNotifications: dto.notificacionesPush,
    errorReports: dto.reportesErrores,
  };
}

export class PrivacyRepositoryImpl implements PrivacyRepository {
  constructor(private readonly remote: PrivacyRemoteDataSource) {}

  async get(): Promise<PrivacySettings> {
    return toPrivacySettings(await this.remote.get());
  }

  async acceptNotice(version: string): Promise<PrivacySettings> {
    return toPrivacySettings(await this.remote.update({ avisoPrivacidad: { aceptado: true, version } }));
  }

  async setPreference(preference: PrivacyPreference, enabled: boolean): Promise<PrivacySettings> {
    return toPrivacySettings(await this.remote.update({ [FIELD_BY_PREFERENCE[preference]]: enabled }));
  }

  deleteAccount(password: string): Promise<void> {
    return this.remote.deleteAccount(password);
  }
}
