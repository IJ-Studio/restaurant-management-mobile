import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { CurrentOrderScreen } from '../screens/CurrentOrderScreen';
import { useCurrentOrderStore } from '../store/currentOrderStore';

const Tab = createBottomTabNavigator();

const tacos = { id: '1', name: 'Tacos', price: 89.5, available: true };
const agua = { id: '2', name: 'Agua', price: 35, available: true };

async function renderScreen() {
  await render(
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="orders" component={CurrentOrderScreen} />
        <Tab.Screen name="menu">{() => <Text>Pantalla de menú</Text>}</Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>,
  );
}

describe('CurrentOrderScreen', () => {
  beforeEach(() => useCurrentOrderStore.getState().reset());

  it('pide un número de mesa válido', async () => {
    await renderScreen();
    await fireEvent.changeText(screen.getByLabelText('Número de mesa'), '0');
    await fireEvent.press(screen.getByText('Abrir mesa'));

    expect(screen.getByText('Escribe un número de mesa del 1 al 999.')).toBeOnTheScreen();
    expect(useCurrentOrderStore.getState().activeTable).toBeNull();
  });

  it('abre una mesa vacía y lleva al menú para agregar platillos', async () => {
    await renderScreen();
    await fireEvent.changeText(screen.getByLabelText('Número de mesa'), '7');
    await fireEvent.press(screen.getByText('Abrir mesa'));

    expect(screen.getByRole('header')).toHaveTextContent('Mesa 7');
    expect(screen.getByText('Sin platillos. Agrégalos desde el menú.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Agregar platillos'));
    expect(await screen.findByText('Pantalla de menú')).toBeOnTheScreen();
  });

  it('muestra los platillos, edita cantidades y recalcula el total', async () => {
    await act(async () => {
      const store = useCurrentOrderStore.getState();
      store.openTable('4');
      store.addDish(tacos, 2);
      store.addDish(agua);
    });
    await renderScreen();

    expect(screen.getByText('$214.00')).toBeOnTheScreen();
    expect(screen.getByText('Total estimado (3 platillos)')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Agregar uno de Tacos'));
    expect(screen.getByLabelText('3 de Tacos')).toBeOnTheScreen();
    expect(screen.getByText('$303.50')).toBeOnTheScreen();

    await fireEvent.press(screen.getByLabelText('Quitar uno de Agua'));
    expect(screen.queryByText('Agua')).toBeNull();
    expect(screen.getByText('Total estimado (3 platillos)')).toBeOnTheScreen();
  });

  it('cambia entre mesas abiertas sin perder sus pedidos', async () => {
    await act(async () => {
      const store = useCurrentOrderStore.getState();
      store.openTable('2');
      store.addDish(agua);
      store.openTable('5');
      store.addDish(tacos);
    });
    await renderScreen();

    expect(screen.getByText('Tacos')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Mesa 2'));
    expect(screen.getByText('Agua')).toBeOnTheScreen();
    expect(screen.queryByText('Tacos')).toBeNull();
  });

  it('descarta el pedido de la mesa', async () => {
    await act(async () => {
      useCurrentOrderStore.getState().openTable('3');
      useCurrentOrderStore.getState().addDish(tacos);
    });
    await renderScreen();

    await fireEvent.press(screen.getByText('Descartar pedido de la mesa'));

    expect(useCurrentOrderStore.getState().orders).toEqual({});
    expect(screen.getByLabelText('Número de mesa')).toBeOnTheScreen();
  });
});

describe('currentOrderStore', () => {
  beforeEach(() => useCurrentOrderStore.getState().reset());

  it('sin mesa activa no hace nada', () => {
    const store = useCurrentOrderStore.getState();
    store.addDish(tacos);
    store.setQuantity('1', 3);
    store.removeDish('1');
    store.discardActive();
    expect(useCurrentOrderStore.getState().orders).toEqual({});
  });

  it('reabrir una mesa conserva su pedido', () => {
    const store = useCurrentOrderStore.getState();
    store.openTable('1');
    store.addDish(tacos);
    store.openTable('2');
    store.openTable('1');
    expect(useCurrentOrderStore.getState().orders['1'].lines).toHaveLength(1);
    store.removeDish('1');
    expect(useCurrentOrderStore.getState().orders['1'].lines).toHaveLength(0);
  });
});
