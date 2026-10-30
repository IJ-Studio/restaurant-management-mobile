import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Button } from '../Button';
import { Card } from '../Card';
import { EmptyState } from '../EmptyState';
import { ListItem } from '../ListItem';
import { Notice } from '../Notice';
import { PlaceholderScreen } from '../PlaceholderScreen';
import { ScreenHeader } from '../ScreenHeader';
import { ScreenState } from '../ScreenState';
import { StatusBadge } from '../StatusBadge';
import { TextField } from '../TextField';

describe('Button', () => {
  it('es un botón con su texto como nombre y responde al toque', async () => {
    const onPress = jest.fn();
    await render(<Button label="Guardar" onPress={onPress} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Guardar' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('cargando: conserva el nombre, avisa que está ocupado y no responde', async () => {
    const onPress = jest.fn();
    await render(<Button label="Entrar" onPress={onPress} loading variant="secondary" />);

    const button = screen.getByRole('button', { name: 'Entrar' });
    expect(button).toBeBusy();
    expect(button).toBeDisabled();
    expect(screen.queryByText('Entrar')).toBeNull();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('deshabilitado no responde', async () => {
    const onPress = jest.fn();
    await render(
      <Button
        label="Enviar"
        onPress={onPress}
        disabled
        variant="outline"
        accessibilityLabel="Enviar a cocina"
      />,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Enviar a cocina' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('TextField', () => {
  it('usa la etiqueta como nombre accesible y muestra el error', async () => {
    const onChangeText = jest.fn();
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    await render(
      <TextField
        label="Correo"
        value=""
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        error="Ingresa un correo válido."
      />,
    );

    const input = screen.getByLabelText('Correo');
    await fireEvent(input, 'focus');
    await fireEvent.changeText(input, 'ana@quijote.mx');
    await fireEvent(input, 'blur');
    expect(onChangeText).toHaveBeenCalledWith('ana@quijote.mx');
    expect(onFocus).toHaveBeenCalled();
    expect(onBlur).toHaveBeenCalled();
    expect(screen.getByText('Ingresa un correo válido.')).toBeOnTheScreen();
  });

  it('respeta un nombre accesible propio y el modo solo lectura', async () => {
    await render(
      <TextField label="Notas (opcional)" accessibilityLabel="Notas" editable={false} multiline />,
    );
    expect(screen.getByLabelText('Notas')).toHaveProp('editable', false);
  });
});

describe('ScreenHeader, StatusBadge y Notice', () => {
  it('el título es un encabezado y el aviso se anuncia como alerta', async () => {
    await render(
      <>
        <ScreenHeader eyebrow="Menú" title="Platillos" subtitle="Del día" size="display" align="center" />
        <StatusBadge label="Confirmada" tone="success" />
        <Notice message="Reservación guardada." tone="success" />
      </>,
    );

    expect(screen.getByRole('header')).toHaveTextContent('Platillos');
    expect(screen.getByText('Menú')).toBeOnTheScreen();
    expect(screen.getByText('Del día')).toBeOnTheScreen();
    expect(screen.getByText('Confirmada')).toBeOnTheScreen();
    expect(screen.getByRole('alert')).toHaveTextContent('Reservación guardada.');
  });

  it('PlaceholderScreen muestra el título y la descripción', async () => {
    await render(<PlaceholderScreen title="Cobros" description="Cobro de cuentas." />);
    expect(screen.getByRole('header')).toHaveTextContent('Cobros');
    expect(screen.getByText('Cobro de cuentas.')).toBeOnTheScreen();
  });
});

describe('EmptyState', () => {
  it('con acción muestra el botón', async () => {
    const onPress = jest.fn();
    await render(<EmptyState message="Sin pedidos." action={{ label: 'Ir al menú', onPress }} />);

    await fireEvent.press(screen.getByRole('button', { name: 'Ir al menú' }));
    expect(onPress).toHaveBeenCalled();
  });
});

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
