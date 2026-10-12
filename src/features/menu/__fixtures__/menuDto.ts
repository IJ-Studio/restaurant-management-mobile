import type { CategoryWithDishesDto, DishDto } from '../data/dtos/MenuDto';

export function makeDishDto(overrides: Partial<DishDto> = {}): DishDto {
  return {
    id: 1,
    categoriaId: 10,
    codigo: 'PF-01',
    nombre: 'Enchiladas suizas',
    descripcion: 'Tortillas rellenas de pollo.',
    descripcionCorta: 'Pollo y salsa verde',
    imagenUrl: 'https://cdn.quijote.mx/enchiladas.jpg',
    precio: '145.50',
    precioCosto: '52.00',
    notasCocina: 'Sin cebolla para la mesa 4',
    tiempoPreparacion: 15,
    disponible: true,
    esVegetariano: false,
    esVegano: false,
    esSinGluten: true,
    esPicante: true,
    nivelPicante: 2,
    esPopular: true,
    esNuevo: false,
    esDelChef: false,
    orden: 1,
    ...overrides,
  };
}

export function makeCategoryDto(overrides: Partial<CategoryWithDishesDto> = {}): CategoryWithDishesDto {
  return {
    id: 10,
    nombre: 'Platos fuertes',
    orden: 1,
    activa: true,
    platillos: [makeDishDto()],
    ...overrides,
  };
}
