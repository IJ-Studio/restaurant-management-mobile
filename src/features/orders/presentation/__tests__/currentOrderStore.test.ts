import { createDependencies } from '../../../../core/di/dependencies';
import { makeSession } from '../../../auth/__fixtures__/auth';
import { cafe, enchiladas } from '../../__fixtures__/orders';
import { createCurrentOrderStore } from '../store/currentOrderStore';

describe('currentOrderStore', () => {
  it('maneja el pedido en curso de la mesa', () => {
    const store = createCurrentOrderStore();
    const { add, setQuantity, remove, setTable } = store.getState();

    add(enchiladas);
    add(cafe);
    setQuantity(1, 3);
    setTable('5');
    expect(store.getState().order).toEqual({
      tableNumber: '5',
      lines: [
        { ...enchiladas, quantity: 3 },
        { ...cafe, quantity: 1 },
      ],
    });

    remove(4);
    expect(store.getState().order.lines).toHaveLength(1);

    store.getState().clear();
    expect(store.getState().order).toEqual({ tableNumber: null, lines: [] });
  });

  it('al cerrar sesión se borra el pedido a medias', () => {
    const deps = createDependencies();
    deps.sessionStore.getState().setSession(makeSession());
    deps.currentOrderStore.getState().add(enchiladas);

    deps.sessionStore.getState().clearSession();

    expect(deps.currentOrderStore.getState().order.lines).toEqual([]);
  });
});
