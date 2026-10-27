import { fireEvent, screen } from '@testing-library/react-native';
import { measureRenders } from 'reassure';

import { makeMenu } from '../core/testing/data/loadData';
import { toMenu } from '../features/menu/data/mappers/menuMapper';
import { MenuNavigator } from '../features/menu/presentation/navigation/MenuNavigator';
import { makeWrapper, resolved } from '../core/testing/perf';

// Menú de un restaurante grande: 120 platillos en 10 categorías.
const menu = toMenu(makeMenu(120));

describe('Rendimiento: Menú', () => {
  it('carga del menú y búsqueda de un platillo', async () => {
    // Arrange
    const wrapper = makeWrapper({ getMenuUseCase: resolved(menu) });
    const scenario = async () => {
      await screen.findByText('Platillo 1');
      await fireEvent.changeText(screen.getByLabelText('Buscar platillo'), 'Platillo 11');
      await screen.findByText('Platillo 110');
    };

    // Act / Assert
    await measureRenders(<MenuNavigator />, { wrapper, scenario });
  });
});
