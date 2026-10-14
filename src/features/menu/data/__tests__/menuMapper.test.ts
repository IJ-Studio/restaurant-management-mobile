import { makeCategoryDto, makeDishDto } from '../../__fixtures__/menuDto';
import { toDish, toMenu } from '../mappers/menuMapper';

describe('toDish', () => {
  it('convierte la fila del API en un platillo del dominio', () => {
    expect(toDish(makeDishDto())).toEqual({
      id: 1,
      categoryId: 10,
      name: 'Enchiladas suizas',
      description: 'Tortillas rellenas de pollo.',
      shortDescription: 'Pollo y salsa verde',
      imageUrl: 'https://cdn.quijote.mx/enchiladas.jpg',
      price: 145.5,
      prepTimeMinutes: 15,
      available: true,
      tags: ['sin-gluten', 'picante', 'popular'],
      spicyLevel: 2,
    });
  });

  it('no expone el costo ni las notas internas de cocina', () => {
    const serialized = JSON.stringify(toDish(makeDishDto()));
    expect(serialized).not.toContain('52.00');
    expect(serialized).not.toContain('mesa 4');
  });

  it('acepta el precio como número', () => {
    expect(toDish(makeDishDto({ precio: 80 })).price).toBe(80);
  });

  it('rechaza un precio inválido', () => {
    expect(() => toDish(makeDishDto({ precio: 'gratis' }))).toThrow('Precio inválido');
  });

  it.each([
    ['http://cdn.quijote.mx/a.jpg', undefined],
    ['javascript:alert(1)', undefined],
    ['https://cdn.quijote.mx/a b.jpg', undefined],
    [null, undefined],
    ['https://cdn.quijote.mx/a.jpg', 'https://cdn.quijote.mx/a.jpg'],
  ])('imagen %p → %p (solo HTTPS)', (imagenUrl, expected) => {
    expect(toDish(makeDishDto({ imagenUrl })).imageUrl).toBe(expected);
  });

  it('completa valores nulos', () => {
    const dish = toDish(
      makeDishDto({ descripcion: null, descripcionCorta: null, tiempoPreparacion: null, disponible: null }),
    );
    expect(dish).toMatchObject({ description: '', available: true });
    expect(dish.shortDescription).toBeUndefined();
    expect(dish.prepTimeMinutes).toBeUndefined();
  });

  it('marca como agotado un platillo no disponible y sin nivel de picante si no pica', () => {
    const dish = toDish(makeDishDto({ disponible: false, esPicante: false, nivelPicante: 3 }));
    expect(dish.available).toBe(false);
    expect(dish.spicyLevel).toBeUndefined();
  });
});

describe('toMenu', () => {
  it('ordena categorías y platillos por `orden` y omite categorías inactivas', () => {
    const menu = toMenu([
      makeCategoryDto({ id: 2, nombre: 'Bebidas', orden: 2 }),
      makeCategoryDto({ id: 3, nombre: 'Temporada', orden: 0, activa: false }),
      makeCategoryDto({
        id: 1,
        nombre: 'Entradas',
        orden: 1,
        platillos: [
          makeDishDto({ id: 8, nombre: 'Sopa', orden: 2 }),
          makeDishDto({ id: 9, nombre: 'Guacamole', orden: 1 }),
        ],
      }),
    ]);

    expect(menu.map((c) => c.name)).toEqual(['Entradas', 'Bebidas']);
    expect(menu[0].dishes.map((d) => d.name)).toEqual(['Guacamole', 'Sopa']);
  });

  it('tolera una categoría sin arreglo de platillos', () => {
    expect(toMenu([makeCategoryDto({ platillos: undefined as never })])[0].dishes).toEqual([]);
  });
});
