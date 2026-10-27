import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';

import { makeOrderLines, makeTables } from '../core/testing/data/loadData';
import { createCurrentOrderStore } from '../features/orders/presentation/store/currentOrderStore';
import { TableOrderScreen } from '../features/orders/presentation/screens/TableOrderScreen';
import { makeWrapper, resolved } from '../core/testing/perf';

// Pedido grande de una mesa: 30 platillos distintos y 20 mesas para elegir.
const tables = makeTables(20).map((t) => ({ id: t.id, number: t.numero, capacity: t.capacidad }));
const lines = makeOrderLines(30);

describe('Rendimiento: Pedido de mesa', () => {
  it('render del pedido, elegir mesa y cambiar una cantidad', async () => {
    // Arrange: el pedido se reinicia antes de cada corrida para que todas midan lo mismo.
    const currentOrderStore = createCurrentOrderStore();
    const wrapper = makeWrapper({ currentOrderStore, listTablesUseCase: resolved(tables) });
    const scenario = async () => {
      await fireEvent.press(await screen.findByRole('radio', { name: 'Mesa 5' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Agregar uno de Platillo 1' }));
    };
    const beforeEach = () => {
      currentOrderStore.setState({ order: { tableNumber: null, lines } });
    };

    // Act / Assert
    await measureRenders(<TableOrderScreen />, { wrapper, scenario, beforeEach });
  });
});
