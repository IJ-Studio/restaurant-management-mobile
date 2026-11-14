/* global API_URL, PASSWORD, ROLE_EMAIL, ACTION, ORDER_ID, ESTATUS, MESA, PLATILLO_ID, COMENSALES, http, output */
// Globales que inyecta Maestro en `runScript` (variables `env` del flujo, `http` y `output`).
// Simula «otro teléfono»: cambia un pedido por el API, como lo haría cocina desde su app.
// Entradas (env): API_URL, ROLE_EMAIL, PASSWORD, ACTION ('crear' | 'estatus' | 'detalle'), ORDER_ID,
// ESTATUS y, al crear, MESA, PLATILLO_ID y COMENSALES (por omisión A04, 1 y 2).
// Salidas: output.orderId y, con 'detalle', output.pagado, output.restante y output.estatus.
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
      body: JSON.stringify({
        mesa: typeof MESA === 'undefined' ? 'A04' : MESA,
        numComensales: typeof COMENSALES === 'undefined' ? 2 : Number(COMENSALES),
        items: [{ platilloId: typeof PLATILLO_ID === 'undefined' ? 1 : Number(PLATILLO_ID), cantidad: 1 }],
      }),
    }).body,
  );
  http.post(`${base}/pedidos/confirmar/${created.ordenId}`, { headers: auth, body: '{}' });
  output.orderId = created.ordenId;
} else if (ACTION === 'detalle') {
  const detalle = JSON.parse(http.get(`${base}/pedidos/${ORDER_ID}`, { headers: auth }).body);
  output.pagado = detalle.pagado;
  output.restante = detalle.restante;
  output.estatus = detalle.estatus;
} else {
  http.request(`${base}/pedidos/${ORDER_ID}/estatus`, {
    method: 'PATCH',
    headers: auth,
    body: JSON.stringify({ estatus: ESTATUS }),
  });
  output.orderId = ORDER_ID;
}
