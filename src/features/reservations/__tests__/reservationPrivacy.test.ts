/** Privacidad de HU-04 (MASVS-PRIVACY): los datos del comensal no salen del dispositivo hacia Sentry. */
import type { ErrorEvent } from '@sentry/react-native';

import { scrubEvent } from '../../../core/monitoring/scrub';
import { toCreateRequest } from '../data/mappers/reservationMapper';
import { makeDraft } from '../__fixtures__/reservations';

describe('Privacidad de reservaciones', () => {
  it('nombre, teléfono y correo del cliente no llegan a Sentry', () => {
    const body = toCreateRequest(makeDraft());
    const event = scrubEvent({
      message: 'Error al crear reservación para laura@correo.mx',
      extra: { body },
      breadcrumbs: [
        { category: 'fetch', data: { url: 'https://api.test/reservations?clienteNombre=Laura', body } },
      ],
    } as unknown as ErrorEvent);

    const serialized = JSON.stringify(event);
    expect(serialized).not.toContain('Laura');
    expect(serialized).not.toContain('1234 5678');
    expect(serialized).not.toContain('laura@correo.mx');
  });
});
