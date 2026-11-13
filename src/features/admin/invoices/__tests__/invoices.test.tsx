import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import type { HttpClient } from '../../../../core/http/httpClient';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { renderWithProviders } from '../../../../core/testing/renderWithProviders';
import { InvoicesRepositoryImpl } from '../data/InvoicesRepositoryImpl';
import type { InvoiceRequest, InvoicesRepository } from '../domain/Invoices';
import { InvoicesScreen } from '../presentation/InvoicesScreen';

const req = (extra: Partial<InvoiceRequest> = {}): InvoiceRequest => ({
  id: 4,
  orderId: 'o-1',
  customer: 'ANA RUIZ',
  rfc: 'RUAA800101AB1',
  businessName: 'ANA RUIZ',
  email: 'ana@correo.mx',
  total: 450,
  paid: true,
  requestedAt: '2026-11-13T18:00:00Z',
  ...extra,
});

const repo = (): jest.Mocked<InvoicesRepository> => ({
  pending: jest.fn().mockResolvedValue([req(), req({ id: 5, customer: 'LUIS MORA', paid: false })]),
  issue: jest
    .fn()
    .mockResolvedValue({ folio: 'A-12', emailSent: false, emailReason: 'El correo está apagado.' }),
  reject: jest.fn().mockResolvedValue(undefined),
});

describe('facturas del admin (Fase 2)', () => {
  it('repositorio: mismas rutas que la web', async () => {
    const http = {
      get: jest.fn().mockResolvedValue([
        {
          id: 4,
          ordenId: 'o-1',
          cliente: 'A',
          rfc: null,
          razonSocial: null,
          email: null,
          totalOrden: '450.00',
          estatusOrden: 'pagada',
          creadoEn: 'x',
        },
      ]),
      post: jest.fn().mockResolvedValue({ folio: 'A-1', correo: { enviado: true } }),
    };
    const r = new InvoicesRepositoryImpl(http as unknown as HttpClient);
    await expect(r.pending()).resolves.toMatchObject([{ id: 4, total: 450, paid: true }]);
    await expect(r.issue(4)).resolves.toEqual({ folio: 'A-1', emailSent: true, emailReason: null });
    await r.reject(4, '  RFC mal escrito ');
    expect(http.get).toHaveBeenCalledWith('solicitudes-factura?estatus=pendiente');
    expect(http.post).toHaveBeenCalledWith('solicitudes-factura/4/emitir');
    expect(http.post).toHaveBeenCalledWith('solicitudes-factura/4/rechazar', { motivo: 'RFC mal escrito' });
  });

  it('emite solo pedidos pagados y avisa si no salió el correo', async () => {
    const r = repo();
    await renderWithProviders(<InvoicesScreen />, makeTestDependencies({ invoicesRepository: r }));
    expect(await screen.findByText('Ana Ruiz')).toBeOnTheScreen();
    expect(screen.getByLabelText('Emitir la factura de Luis Mora')).toBeDisabled();
    await fireEvent.press(screen.getByLabelText('Emitir la factura de Ana Ruiz'));
    await waitFor(() => expect(r.issue).toHaveBeenCalledWith(4));
    expect(await screen.findByText('Factura A-12 emitida. El correo está apagado.')).toBeOnTheScreen();
  });

  it('rechazar exige un motivo de 5 caracteres, con el mensaje del API', async () => {
    const r = repo();
    await renderWithProviders(<InvoicesScreen />, makeTestDependencies({ invoicesRepository: r }));
    await fireEvent.press(await screen.findByLabelText('Rechazar la factura de Ana Ruiz'));
    await fireEvent.changeText(screen.getByLabelText('Motivo del rechazo'), 'RFC');
    await fireEvent.press(screen.getByRole('button', { name: 'Rechazar solicitud' }));
    expect(
      await screen.findByText('Escribe el motivo del rechazo (al menos 5 caracteres).'),
    ).toBeOnTheScreen();
    expect(r.reject).not.toHaveBeenCalled();
    await fireEvent.changeText(screen.getByLabelText('Motivo del rechazo'), 'El RFC no existe en el SAT');
    await fireEvent.press(screen.getByRole('button', { name: 'Rechazar solicitud' }));
    await waitFor(() => expect(r.reject).toHaveBeenCalledWith(4, 'El RFC no existe en el SAT'));
  });
});
