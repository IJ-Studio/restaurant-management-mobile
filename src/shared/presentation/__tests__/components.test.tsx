import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { dishBadgeLabels } from '../../../features/menu/presentation/components/DishBadges';
import type { Dish } from '../../../features/menu/domain/entities/Dish';
import { ListItem } from '../components/ListItem';
import { QueryState } from '../components/QueryState';
import { errorMessage } from '../errorMessage';
import { formatPrice } from '../format';
import { AppError } from '../../../core/errors/AppError';

describe('formatPrice', () => {
  it('formatea en pesos mexicanos', () => {
    expect(formatPrice(89.5)).toBe('$89.50');
    expect(formatPrice(1250)).toBe('$1,250.00');
  });
});

describe('errorMessage', () => {
  it('usa el mensaje de AppError y oculta el de errores desconocidos', () => {
    expect(errorMessage(new AppError('network', 'Sin red'))).toBe('Sin red');
    expect(errorMessage(new Error('TypeError: x is undefined'))).toBe('Ocurrió un error inesperado.');
  });
});

describe('ListItem', () => {
  it('muestra título, subtítulo, dato a la derecha y reacciona al toque', async () => {
    const onPress = jest.fn();
    await render(<ListItem title="Mesa 4" subtitle="2 personas" trailing="19:30" badges={<Text>Nueva</Text>} onPress={onPress} />);

    expect(screen.getByText('Mesa 4')).toBeOnTheScreen();
    expect(screen.getByText('2 personas')).toBeOnTheScreen();
    expect(screen.getByText('19:30')).toBeOnTheScreen();
    expect(screen.getByText('Nueva')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });

  it('sin onPress no es un botón', async () => {
    await render(<ListItem title="Solo lectura" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});

describe('QueryState', () => {
  it('no muestra nada sin carga ni error', async () => {
    await render(<QueryState isLoading={false} error={null} />);
    expect(screen.toJSON()).toBeNull();
  });

  it('muestra el error sin botón si no hay reintento', async () => {
    await render(<QueryState isLoading={false} error="Falló" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falló');
    expect(screen.queryByText('Reintentar')).toBeNull();
  });
});

describe('dishBadgeLabels', () => {
  const base = {
    tags: {
      vegetarian: true,
      vegan: true,
      glutenFree: false,
      spicy: true,
      spicyLevel: 9,
      popular: false,
      isNew: true,
      chefSpecial: true,
    },
  } as Dish;

  it('resume las etiquetas del platillo (vegano reemplaza a vegetariano, picante máximo 5)', () => {
    expect(dishBadgeLabels(base)).toEqual(['Del chef', 'Nuevo', 'Vegano', 'Picante 🌶🌶🌶🌶🌶']);
  });

  it('picante sin nivel', () => {
    expect(dishBadgeLabels({ ...base, tags: { ...base.tags, spicyLevel: 0, vegan: false } })).toEqual([
      'Del chef',
      'Nuevo',
      'Vegetariano',
      'Picante',
    ]);
  });
});
