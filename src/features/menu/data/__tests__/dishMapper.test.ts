import type { DishDto } from '../dtos/DishDto';
import { toDish } from '../mappers/dishMapper';

const dto: DishDto = {
  id: 5,
  categoriaId: 2,
  nombre: 'Tacos al pastor',
  descripcion: 'Tres tacos con piña.  ',
  descripcionCorta: 'Con piña',
  imagenUrl: 'https://cdn.resto.mx/tacos.jpg',
  precio: '89.50',
  precioCosto: '30.00',
  tiempoPreparacion: 12,
  disponible: true,
  esPicante: true,
  nivelPicante: 2,
  esPopular: true,
};

describe('toDish', () => {
  it('convierte el DTO del API en la entidad del dominio', () => {
    expect(toDish(dto)).toEqual({
      id: '5',
      categoryId: '2',
      name: 'Tacos al pastor',
      description: 'Tres tacos con piña.',
      shortDescription: 'Con piña',
      imageUrl: 'https://cdn.resto.mx/tacos.jpg',
      price: 89.5,
      prepTimeMinutes: 12,
      available: true,
      tags: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        spicy: true,
        spicyLevel: 2,
        popular: true,
        isNew: false,
        chefSpecial: false,
      },
    });
  });

  it('no expone el costo del platillo', () => {
    expect(JSON.stringify(toDish(dto))).not.toContain('30');
  });

  it('marca como agotado solo si el API lo dice', () => {
    expect(toDish({ ...dto, disponible: false }).available).toBe(false);
    expect(toDish({ ...dto, disponible: undefined }).available).toBe(true);
  });

  it.each(['http://cdn.resto.mx/tacos.jpg', 'javascript:alert(1)', '', null])(
    'descarta imágenes que no son HTTPS (%p)',
    (imagenUrl) => {
      expect(toDish({ ...dto, imagenUrl }).imageUrl).toBeNull();
    },
  );

  it('acepta precio numérico y usa 0 si es inválido', () => {
    expect(toDish({ ...dto, precio: 120 }).price).toBe(120);
    expect(toDish({ ...dto, precio: 'abc' }).price).toBe(0);
  });

  it('usa la descripción como resumen si no hay descripción corta', () => {
    expect(toDish({ ...dto, descripcionCorta: null }).shortDescription).toBe('Tres tacos con piña.');
    expect(toDish({ ...dto, descripcion: null, descripcionCorta: null, categoriaId: null })).toMatchObject({
      description: '',
      shortDescription: '',
      categoryId: null,
    });
  });
});
