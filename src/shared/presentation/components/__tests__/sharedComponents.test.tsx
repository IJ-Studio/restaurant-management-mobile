import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Card } from '../Card';
import { ListItem } from '../ListItem';
import { ScreenState } from '../ScreenState';

describe('Card', () => {
  it('renderiza su contenido', async () => {
    await render(
      <Card>
        <Text>Contenido</Text>
      </Card>,
    );
    expect(screen.getByText('Contenido')).toBeOnTheScreen();
  });
});

describe('ListItem', () => {
  it('muestra título, subtítulo, valor y etiqueta, y responde al toque', async () => {
    const onPress = jest.fn();
    await render(
      <ListItem title="Mole" subtitle="Con pollo" trailing="$180.00" badge="Agotado" onPress={onPress} />,
    );

    expect(screen.getByText('Con pollo')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Mole, Agotado, $180.00' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('sin onPress no es un botón', async () => {
    await render(<ListItem title="Mole" imageUrl="https://cdn.quijote.mx/mole.jpg" />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('Mole')).toBeOnTheScreen();
  });
});

describe('ScreenState', () => {
  it('error con reintento', async () => {
    const onRetry = jest.fn();
    await render(<ScreenState kind="error" message="Sin conexión" onRetry={onRetry} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión');
    await fireEvent.press(screen.getByRole('button', { name: 'Reintentar' }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('vacío y cargando', async () => {
    await render(<ScreenState kind="empty" message="Nada por aquí" />);
    expect(screen.getByText('Nada por aquí')).toBeOnTheScreen();

    await render(<ScreenState kind="loading" message="Cargando menú" />);
    expect(screen.getByText('Cargando menú')).toBeOnTheScreen();
  });
});
