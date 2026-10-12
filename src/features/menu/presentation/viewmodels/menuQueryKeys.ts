export const menuQueryKeys = {
  all: ['menu'] as const,
  dish: (id: string) => ['menu', 'dish', id] as const,
};

/** El menú casi no cambia: se considera fresco 5 minutos. */
export const MENU_STALE_TIME = 5 * 60_000;
