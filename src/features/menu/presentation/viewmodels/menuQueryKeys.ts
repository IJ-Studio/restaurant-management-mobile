export const menuQueryKeys = {
  all: ['menu'] as const,
  dish: (id: number) => ['menu', 'dish', id] as const,
};

/** El menú casi no cambia durante el turno: 5 minutos de caché. */
export const MENU_STALE_TIME = 5 * 60 * 1000;
