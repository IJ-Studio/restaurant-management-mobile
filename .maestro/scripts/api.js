/* global API_URL, PASSWORD, ROLE_EMAIL, ACTION, ORDER_ID, ESTATUS, http, output */
// Globales que inyecta Maestro en `runScript` (variables `env` del flujo, `http` y `output`).
// Simula «otro teléfono»: cambia un pedido por el API, como lo haría cocina desde su app.
// Entradas (env): API_URL, ROLE_EMAIL, PASSWORD, ACTION ('crear' | 'estatus'), ORDER_ID, ESTATUS.
// Salidas: output.orderId.
const base = API_URL.replace(/\/+$/, '');
const json = { 'Content-Type': 'application/json' };
const login = http.post(`${base}/auth/sign-in`, {
  headers: json,
  body: JSON.stringify({ email: ROLE_EMAIL, password: PASSWORD || 'Prueba#2026' }),
});
const token = JSON.parse(login.body).accessToken;
const auth = { ...json, Authorization: `Bearer ${token}` };

if (ACTION === 'crear') {
  const created = JSON.parse(
    http.post(`${base}/pedidos/mesa`, {
      headers: auth,
      body: JSON.stringify({ mesa: 'A04', numComensales: 2, items: [{ platilloId: 1, cantidad: 1 }] }),
    }).body,
  );
  http.post(`${base}/pedidos/confirmar/${created.ordenId}`, { headers: auth, body: '{}' });
  output.orderId = created.ordenId;
} else {
  http.request(`${base}/pedidos/${ORDER_ID}/estatus`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ estatus: ESTATUS }),
  });
  output.orderId = ORDER_ID;
}
