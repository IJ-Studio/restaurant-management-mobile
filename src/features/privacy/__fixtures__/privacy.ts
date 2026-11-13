import { PRIVACY_NOTICE_VERSION, type PrivacySettings } from '../domain/entities/PrivacySettings';
import type { PrivacyRepository } from '../domain/repositories/PrivacyRepository';

export function makePrivacy(overrides: Partial<PrivacySettings> = {}): PrivacySettings {
  return {
    noticeAccepted: true,
    noticeVersion: PRIVACY_NOTICE_VERSION,
    noticeAcceptedAt: '2026-11-13T12:00:00.000Z',
    pushNotifications: true,
    errorReports: true,
    ...overrides,
  };
}

/** Aviso sin aceptar: lo que ve quien inicia sesión por primera vez. */
export const pendingPrivacy = (): PrivacySettings =>
  makePrivacy({ noticeAccepted: false, noticeVersion: null, noticeAcceptedAt: null });

export function makePrivacyRepository(
  settings: PrivacySettings = makePrivacy(),
): jest.Mocked<PrivacyRepository> {
  return {
    get: jest.fn().mockResolvedValue(settings),
    acceptNotice: jest.fn().mockResolvedValue(makePrivacy()),
    setPreference: jest.fn().mockResolvedValue(settings),
    deleteAccount: jest.fn().mockResolvedValue(undefined),
  };
}
