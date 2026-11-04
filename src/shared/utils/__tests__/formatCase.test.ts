import { properName, sentenceCase } from '../formatCase';

describe('sentenceCase', () => {
  it.each([
    ['ENCHILADAS SUIZAS', 'Enchiladas suizas'],
    ['¡CAFÉ DE OLLA!', '¡Café de olla!'],
    ['PRECIO CON IVA Y CFDI 4.0', 'Precio con IVA y CFDI 4.0'],
    ['RFC XAXX010101000 DE LA EMPRESA', 'RFC XAXX010101000 de la empresa'],
    ['ESCRIBE A ana@correo.mx', 'Escribe a ana@correo.mx'],
    ['Mole de olla de Huejutla', 'Mole de olla de Huejutla'],
    ['', ''],
  ])('%p → %p', (input, expected) => {
    expect(sentenceCase(input)).toBe(expected);
  });
});

describe('properName', () => {
  it.each([
    ['MARÍA DE LA PEÑA', 'María de la Peña'],
    ['JOSÉ-LUIS ÑAÑEZ', 'José-Luis Ñañez'],
    ['Ana López', 'Ana López'],
  ])('%p → %p', (input, expected) => {
    expect(properName(input)).toBe(expected);
  });
});
