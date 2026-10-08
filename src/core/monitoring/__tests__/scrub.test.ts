import type { ErrorEvent } from '@sentry/react-native';

import { scrubBreadcrumb, scrubData, scrubEvent, scrubString, stripUrl } from '../scrub';

const JWT = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2lnbmF0dXJl';

describe('scrubString', () => {
  it('oculta JWT, tokens Bearer y correos', () => {
    const result = scrubString(`401 con Bearer abc.def-123 y ${JWT} de mesero@elquijote.mx`);

    expect(result).not.toContain('abc.def-123');
    expect(result).not.toContain(JWT);
    expect(result).not.toContain('mesero@elquijote.mx');
    expect(result).toContain('401 con Bearer [Filtrado]');
  });

  it('no altera un texto sin datos sensibles', () => {
    expect(scrubString('Network request failed')).toBe('Network request failed');
  });
});

describe('stripUrl', () => {
  it('quita query string y fragmento', () => {
    expect(stripUrl('https://api.test/orders/7?token=abc#x')).toBe('https://api.test/orders/7');
  });
});

describe('scrubData', () => {
  it('filtra por nombre de clave en cualquier nivel', () => {
    const result = scrubData({
      mesa: 4,
      accessToken: 'abc',
      cliente: { nombre: 'Ana', correo: 'ana@test.mx', rfc: 'XAXX010101000', platillos: ['sopa'] },
      headers: [{ Authorization: 'Bearer abc' }],
    });

    expect(result).toEqual({
      mesa: 4,
      accessToken: '[Filtrado]',
      cliente: { nombre: '[Filtrado]', correo: '[Filtrado]', rfc: '[Filtrado]', platillos: ['sopa'] },
      headers: [{ Authorization: '[Filtrado]' }],
    });
  });

  it('corta estructuras demasiado profundas o circulares', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => scrubData(circular)).not.toThrow();
  });
});

describe('scrubBreadcrumb', () => {
  it('limpia mensaje, datos y URL', () => {
    const result = scrubBreadcrumb({
      category: 'fetch',
      message: `sesión de admin@test.mx`,
      data: { url: 'https://api.test/login?email=admin@test.mx', status_code: 200, password: '1234' },
    });

    expect(result.message).toBe('sesión de [Filtrado]');
    expect(result.data).toEqual({ url: 'https://api.test/login', status_code: 200, password: '[Filtrado]' });
  });
});

describe('scrubEvent', () => {
  it('no deja salir datos personales ni tokens', () => {
    const event: ErrorEvent = {
      type: undefined,
      message: `Falló el login de cajero@test.mx`,
      user: { id: '42', email: 'cajero@test.mx', username: 'cajero', ip_address: '10.0.0.1' },
      request: {
        url: 'https://api.test/auth/refresh?refresh_token=abc',
        method: 'POST',
        headers: { Authorization: `Bearer ${JWT}` },
        cookies: { sid: 'abc' },
        data: { password: '1234' },
      },
      exception: { values: [{ type: 'Error', value: `Token inválido: ${JWT}` }] },
      extra: { refreshToken: 'abc', intento: 2 },
      breadcrumbs: [{ data: { url: 'https://api.test/me?token=abc' } }],
    };

    const result = scrubEvent(event);
    const sent = JSON.stringify(result);

    expect(result.user).toEqual({ id: '42' });
    expect(result.request).toEqual({ method: 'POST', url: 'https://api.test/auth/refresh' });
    expect(result.extra).toEqual({ refreshToken: '[Filtrado]', intento: 2 });
    for (const secret of [JWT, 'cajero@test.mx', '10.0.0.1', '1234', 'refresh_token', 'token=abc']) {
      expect(sent).not.toContain(secret);
    }
  });

  it('conserva un evento sin datos sensibles', () => {
    const event: ErrorEvent = { type: undefined, exception: { values: [{ type: 'TypeError', value: 'x is undefined' }] } };

    expect(scrubEvent(event)).toEqual(event);
  });
});
