import { request } from 'node:http';

import { HttpClient } from '../http/httpClient';

/**
 * Cliente contra el API real local (copia de la BD, nunca producción). Las pruebas `*.real.test`
 * solo corren con E2E_API_REAL=http://127.0.0.1:4100 y usan los usuarios de prueba de la copia.
 * En Jest, `jest-expo` sustituye el `fetch` global; aquí se usa uno mínimo sobre `node:http`.
 */
export const API_REAL = process.env.E2E_API_REAL ?? '';
export const describeReal = API_REAL ? describe : describe.skip;

const fetchNodo = ((
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: string } = {},
) =>
  new Promise((resolve, reject) => {
    const req = request(url, { method: init.method ?? 'GET', headers: init.headers }, (res) => {
      let texto = '';
      res.setEncoding('utf8');
      res.on('data', (c: string) => (texto += c));
      res.on('end', () =>
        resolve({
          ok: (res.statusCode ?? 0) >= 200 && (res.statusCode ?? 0) < 300,
          status: res.statusCode ?? 0,
          text: () => Promise.resolve(texto),
        }),
      );
    });
    req.on('error', reject);
    if (init.body) req.write(init.body);
    req.end();
  })) as unknown as typeof fetch;

export async function clienteComo(rol: 'admin' | 'cajero' | 'mesero' | 'cocina' | 'cliente') {
  const http = new HttpClient({
    baseUrl: API_REAL,
    timeoutMs: 20_000,
    allowInsecure: true,
    fetchFn: fetchNodo,
  });
  const sesion = await http.post<{ accessToken: string }>('auth/sign-in', {
    email: `${rol}@prueba.local`,
    password: 'Prueba#2026x',
  });
  http.setTokenProvider(() => sesion.accessToken);
  return http;
}
