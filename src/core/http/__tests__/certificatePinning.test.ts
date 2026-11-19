import {
  addSslPinningErrorListener,
  initializeSslPinning,
  isSslPinningAvailable,
} from 'react-native-ssl-public-key-pinning';

import {
  consumePinningRejection,
  initCertificatePinning,
  PINNED_HOSTS,
  setPinningReporter,
} from '../certificatePinning';

jest.mock('react-native-ssl-public-key-pinning', () => ({
  isSslPinningAvailable: jest.fn(),
  initializeSslPinning: jest.fn(),
  addSslPinningErrorListener: jest.fn(),
}));

const available = jest.mocked(isSslPinningAvailable);
const initialize = jest.mocked(initializeSslPinning);
const addListener = jest.mocked(addSslPinningErrorListener);
const report = jest.fn();

describe('certificate pinning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    available.mockReturnValue(true);
    initialize.mockResolvedValue(undefined);
    setPinningReporter(report);
  });

  describe('configuración de pins', () => {
    const hosts = Object.entries(PINNED_HOSTS);

    it('fija el API de producción', () => {
      expect(Object.keys(PINNED_HOSTS)).toEqual(['api-restaurant-management.onrender.com']);
    });

    it.each(hosts)('%s tiene al menos un pin de respaldo y ninguno repetido', (_host, options) => {
      expect(options.publicKeyHashes.length).toBeGreaterThanOrEqual(2);
      expect(new Set(options.publicKeyHashes).size).toBe(options.publicKeyHashes.length);
    });

    it.each(hosts)('cada pin de %s es un SHA-256 en base64 (32 bytes)', (_host, options) => {
      for (const pin of options.publicKeyHashes) {
        expect(pin).toMatch(/^[A-Za-z0-9+/]{43}=$/);
      }
    });

    it.each(hosts)('%s tiene fecha de caducidad en formato yyyy-MM-dd', (_host, options) => {
      expect(options.expirationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('activación', () => {
    it('activa el pinning con los hosts fijados y escucha los rechazos', async () => {
      await initCertificatePinning();

      expect(initialize).toHaveBeenCalledWith(PINNED_HOSTS);
      expect(addListener).toHaveBeenCalledTimes(1);
    });

    it('sin módulo nativo (Expo Go, pruebas) no hace nada', async () => {
      available.mockReturnValue(false);

      await initCertificatePinning();

      expect(initialize).not.toHaveBeenCalled();
    });

    it('si la activación falla no rechaza y lo reporta', async () => {
      const failure = new Error('módulo nativo roto');
      initialize.mockRejectedValue(failure);

      await expect(initCertificatePinning()).resolves.toBeUndefined();

      expect(report).toHaveBeenCalledWith('No se pudo activar el certificate pinning', failure);
    });
  });

  describe('rechazo de un certificado', () => {
    it('se informa una sola vez y se reporta sin datos personales', async () => {
      await initCertificatePinning();
      const [onPinningError] = addListener.mock.calls[0];

      expect(consumePinningRejection()).toBe(false);

      onPinningError({ serverHostname: 'api-restaurant-management.onrender.com' });

      expect(consumePinningRejection()).toBe(true);
      expect(consumePinningRejection()).toBe(false);
      expect(report).toHaveBeenCalledWith(
        'Certificado rechazado por pinning: api-restaurant-management.onrender.com',
      );
    });
  });
});

describe('builds de EAS', () => {
  // Expo 58 cambia el `fetch` global por `expo/fetch`, que no pasa por el cliente OkHttp de React
  // Native: el pinning solo cubre las peticiones si el build usa el fetch de RN (visto en el Pixel).
  it('todos los perfiles usan el fetch de React Native', () => {
    const eas = require('../../../../eas.json') as {
      build: Record<string, { env?: Record<string, string>; extends?: string }>;
    };
    const sinFetchRn = Object.entries(eas.build)
      .filter(([, perfil]) => !perfil.extends && perfil.env?.EXPO_PUBLIC_USE_RN_FETCH !== '1')
      .map(([nombre]) => nombre);
    expect(sinFetchRn).toEqual([]);
  });
});
