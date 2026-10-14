import { validateCredentials } from '../entities/credentials';

describe('validateCredentials', () => {
  it('acepta un correo y una contraseña válidos', () => {
    expect(validateCredentials({ email: ' ana@quijote.mx ', password: 'Pass#2026' })).toEqual({});
  });

  it('pide ambos campos cuando están vacíos', () => {
    expect(validateCredentials({ email: '  ', password: '' })).toEqual({
      email: 'Ingresa tu correo.',
      password: 'Ingresa tu contraseña.',
    });
  });

  it.each(['ana', 'ana@', 'ana@quijote', 'ana @quijote.mx', `${'a'.repeat(250)}@quijote.mx`])(
    'rechaza el correo "%s"',
    (email) => {
      expect(validateCredentials({ email, password: 'Pass#2026' }).email).toBe('Ingresa un correo válido.');
    },
  );

  it('exige al menos 8 caracteres de contraseña (igual que el API)', () => {
    expect(validateCredentials({ email: 'ana@quijote.mx', password: '1234567' }).password).toMatch(/8/);
  });
});
