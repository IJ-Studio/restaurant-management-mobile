import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import {
  phoneWithCountryCode,
  SaveStaffUseCase,
  StaffValidationError,
  type StaffMember,
  type StaffRepository,
} from '../domain/Staff';
import { StaffScreen } from '../presentation/StaffScreen';

const member = (extra: Partial<StaffMember> = {}): StaffMember => ({
  id: 2,
  name: 'PABLO',
  lastname: 'GIL',
  email: 'pablo@prueba.local',
  phone: '+527711234567',
  roleId: 3,
  active: true,
  ...extra,
});

const repo = (): jest.Mocked<StaffRepository> => ({
  list: jest.fn().mockResolvedValue([
    member(),
    member({
      id: 5,
      name: 'Lucía',
      lastname: 'Mora',
      email: 'lucia@prueba.local',
      roleId: 4,
      active: false,
    }),
  ]),
  create: jest.fn().mockResolvedValue(undefined),
  update: jest.fn().mockResolvedValue(undefined),
  changeRole: jest.fn().mockResolvedValue(undefined),
  deactivate: jest.fn().mockResolvedValue(undefined),
  reactivate: jest.fn().mockResolvedValue(undefined),
});

const input = {
  name: ' Iván ',
  lastname: 'Soto',
  email: 'ivan@elquijote.mx',
  phone: '771 555 6666',
  password: 'Bodega#Tinta9',
  roleId: 3,
};

describe('personal: dominio (Fase 2, mismas reglas que la web)', () => {
  it('teléfono de México con o sin +52', () => {
    expect(phoneWithCountryCode('771 555 6666')).toBe('+527715556666');
    expect(phoneWithCountryCode('+52 771 555 6666')).toBe('+527715556666');
    expect(phoneWithCountryCode('12345')).toBeNull();
  });

  it('alta: valida con los mensajes de la web y no llama al API si falta algo', async () => {
    const r = repo();
    const uc = new SaveStaffUseCase(r);
    const error = await uc
      .execute({ ...input, name: ' ', email: 'no-es-correo', phone: '123', password: 'corta', roleId: 1 })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(StaffValidationError);
    expect((error as StaffValidationError).errors).toEqual({
      name: 'Escribe el nombre.',
      email: 'Ingresa un correo electrónico válido.',
      phone: 'Debe contener 10 dígitos.',
      password: 'Mínimo 8 caracteres.',
      roleId: 'Elige un rol.',
    });
    expect(r.create).not.toHaveBeenCalled();
    await uc.execute(input);
    expect(r.create).toHaveBeenCalledWith({ ...input, name: 'Iván', phone: '+527715556666' });
  });

  it('edición: no pide correo ni contraseña y solo cambia el rol si cambió', async () => {
    const r = repo();
    const uc = new SaveStaffUseCase(r);
    await uc.execute({ ...input, email: '', password: '' }, member());
    expect(r.update).toHaveBeenCalledWith(2, { name: 'Iván', lastname: 'Soto', phone: '+527715556666' });
    expect(r.changeRole).not.toHaveBeenCalled();
    await uc.execute({ ...input, email: '', password: '', roleId: 4 }, member());
    expect(r.changeRole).toHaveBeenCalledWith(2, 4);
  });
});

describe('personal: pantalla', () => {
  it('lista activos e inactivos, filtra, y activa con confirmación', async () => {
    const r = repo();
    const deps = makeTestDependencies({ staffRepository: r, saveStaffUseCase: new SaveStaffUseCase(r) });
    await renderWithProviders(<StaffScreen />, deps);

    expect(await screen.findByText('Pablo Gil')).toBeOnTheScreen();
    expect(screen.getByText('Lucía Mora')).toBeOnTheScreen();
    expect(
      screen.getByText(
        '1 activos de 2. Desactivar no borra: la persona deja de entrar y se puede volver a activar.',
      ),
    ).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Inactivos' }));
    expect(screen.queryByText('Pablo Gil')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Activar a Lucía Mora'));
    expect(screen.getByText('Podrá volver a entrar con su correo y su contraseña.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByLabelText('Confirmar: activar a Lucía Mora'));
    await waitFor(() => expect(r.reactivate).toHaveBeenCalledWith(5));
    expect(await screen.findByText('Usuario activado: Lucía Mora.')).toBeOnTheScreen();
    expect(r.deactivate).not.toHaveBeenCalled();
  });

  it('alta con errores muestra cada mensaje junto a su campo', async () => {
    const r = repo();
    const deps = makeTestDependencies({ staffRepository: r, saveStaffUseCase: new SaveStaffUseCase(r) });
    await renderWithProviders(<StaffScreen />, deps);

    await fireEvent.press(await screen.findByRole('button', { name: 'Usuario nuevo' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Crear usuario' }));
    expect(await screen.findByText('Escribe el nombre.')).toBeOnTheScreen();
    expect(screen.getByText('Escribe el correo.')).toBeOnTheScreen();
    expect(screen.getByText('Mínimo 8 caracteres.')).toBeOnTheScreen();
    expect(r.create).not.toHaveBeenCalled();
  });
});
