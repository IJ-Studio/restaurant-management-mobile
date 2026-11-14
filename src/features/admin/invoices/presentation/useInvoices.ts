import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { REJECT_REASON_MESSAGE, validRejectReason, type InvoiceRequest } from '../domain/Invoices';

/** ViewModel de la bandeja de facturas: pendientes, emitir y rechazar con motivo. */
export function useInvoices() {
  const { invoicesRepository } = useDependencies();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const list = useQuery({ queryKey: ['invoice-requests'], queryFn: () => invoicesRepository.pending() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['invoice-requests'] });

  const run = useMutation({
    mutationFn: (job: () => Promise<string>) => job(),
    onSuccess: (text) => {
      feedback.success();
      setMessage({ tone: 'success', text });
      void refresh();
    },
    onError: (e: Error) => {
      feedback.error();
      setMessage({ tone: 'danger', text: userMessage(e, 'Vuelve a intentarlo en un momento.') });
    },
  });
  const go = (job: () => Promise<string>) =>
    run.mutateAsync(job).then(
      () => true,
      () => false,
    );

  return {
    requests: list.data ?? [],
    isLoading: list.isLoading,
    error: list.error ? userMessage(list.error, 'No pudimos traer las solicitudes.') : null,
    refresh,
    message,
    busy: run.isPending,
    issue: (r: InvoiceRequest) =>
      go(() =>
        invoicesRepository
          .issue(r.id)
          .then(
            (i) =>
              `${`Factura ${i.folio ?? ''} emitida`.replace('  ', ' ')}. ${
                i.emailSent ? 'Se envió al correo del cliente.' : (i.emailReason ?? 'No se envió por correo.')
              }`,
          ),
      ),
    reject: (r: InvoiceRequest, reason: string) =>
      validRejectReason(reason)
        ? go(() =>
            invoicesRepository
              .reject(r.id, reason)
              .then(() => 'Solicitud rechazada. El cliente verá el motivo.'),
          )
        : (setMessage({ tone: 'danger', text: REJECT_REASON_MESSAGE }), Promise.resolve(false)),
  };
}
