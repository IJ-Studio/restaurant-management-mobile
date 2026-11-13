import { orderIdFromNotification } from '../entities/notificationTarget';

const notification = (data: Record<string, unknown>) => ({ title: 'Pedido listo', body: 'Mesa B01', data });

describe('orderIdFromNotification', () => {
  it.each(['order_ready', 'order_delivered'])('un aviso %s lleva a su pedido', (type) => {
    expect(
      orderIdFromNotification(notification({ type, orderId: '0534f79e-c6a7-46ef-9bef-51cb1b5560c6' })),
    ).toBe('0534f79e-c6a7-46ef-9bef-51cb1b5560c6');
  });

  it.each([
    ['tipo desconocido', { type: 'promocion', orderId: 'a1' }],
    ['sin tipo', { orderId: 'a1' }],
    ['sin pedido', { type: 'order_ready' }],
    ['id que no es texto', { type: 'order_ready', orderId: 42 }],
    ['id con una ruta dentro', { type: 'order_ready', orderId: '../perfil' }],
    ['id vacío', { type: 'order_ready', orderId: '' }],
  ])('%s → no lleva a ningún pedido', (_caso, data) => {
    expect(orderIdFromNotification(notification(data))).toBeNull();
  });
});
