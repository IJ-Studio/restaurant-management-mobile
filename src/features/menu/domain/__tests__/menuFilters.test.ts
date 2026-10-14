import { makeMenu } from '../../__fixtures__/menu';
import { filterMenu } from '../entities/menuFilters';

describe('filterMenu', () => {
  it('sin búsqueda devuelve el menú completo', () => {
    const menu = makeMenu();
    expect(filterMenu(menu, '  ')).toBe(menu);
  });

  it('busca sin importar acentos ni mayúsculas', () => {
    const result = filterMenu(makeMenu(), 'CAFE');
    expect(result).toHaveLength(1);
    expect(result[0].dishes.map((d) => d.name)).toEqual(['Café de olla']);
  });

  it('busca también en la descripción', () => {
    expect(filterMenu(makeMenu(), 'piloncillo')[0].dishes[0].name).toBe('Café de olla');
  });

  it('descarta categorías sin coincidencias', () => {
    expect(filterMenu(makeMenu(), 'nogada').map((c) => c.name)).toEqual(['Platos fuertes']);
    expect(filterMenu(makeMenu(), 'pizza')).toEqual([]);
  });
});
