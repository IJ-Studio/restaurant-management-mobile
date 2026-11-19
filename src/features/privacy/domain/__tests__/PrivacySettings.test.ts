import { makePrivacy, pendingPrivacy } from '../../__fixtures__/privacy';
import { needsConsent } from '../entities/PrivacySettings';

describe('needsConsent', () => {
  it('pide el aviso a quien nunca lo aceptó', () => {
    expect(needsConsent(pendingPrivacy())).toBe(true);
  });

  it('no lo pide a quien aceptó la versión vigente', () => {
    expect(needsConsent(makePrivacy())).toBe(false);
  });

  it('lo vuelve a pedir si el aviso cambió de versión', () => {
    expect(needsConsent(makePrivacy({ noticeVersion: '2025-01' }))).toBe(true);
  });

  it('lo pide a quien retiró su aceptación', () => {
    expect(needsConsent(makePrivacy({ noticeAccepted: false }))).toBe(true);
  });
});
