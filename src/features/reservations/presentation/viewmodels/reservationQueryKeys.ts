export const reservationQueryKeys = {
  all: ['reservations'] as const,
  active: ['reservations', 'active'] as const,
  recent: ['reservations', 'recent'] as const,
};
