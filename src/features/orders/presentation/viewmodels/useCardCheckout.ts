import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import type { OrderDetail } from '../../domain/entities/ActiveOrder';
import { refreshOrderData } from './orderQueryKeys';

const PAID = 'Pago con tarjeta aprobado. El pedido quedó pagado.';

/**
 * ViewModel del cobro con tarjeta en la app (Stripe). Solo se ofrece para la cuenta completa y si
 * el build tiene la llave pública: una cuenta separada se cobra en caja.
 */
export function useCardCheckout(order: OrderDetail | undefined) {
  const { checkoutUseCase } = useDependencies();
  const queryClient = useQueryClient();

  const checkout = useMutation({
    mutationFn: () =>
      checkoutUseCase.execute({
        id: order?.id ?? '',
        remaining: order?.remaining ?? 0,
        paymentsCount: order?.payments.length ?? 0,
      }),
    onSuccess: (result) => {
      if (result.status === 'paid') feedback.success();
      else if (result.status === 'failed') feedback.error();
      void refreshOrderData(queryClient);
    },
    onError: () => feedback.error(),
  });

  const result = checkout.data;
  let message: { tone: 'success' | 'warning' | 'danger'; text: string } | null = null;
  if (checkout.error)
    message = { tone: 'danger', text: userMessage(checkout.error, 'No se pudo cobrar con tarjeta.') };
  else if (result?.status === 'paid') message = { tone: 'success', text: PAID };
  else if (result?.status === 'failed') message = { tone: 'danger', text: result.message };
  else if (result?.status === 'pending') message = { tone: 'warning', text: result.message };

  return {
    available: checkoutUseCase.isAvailable() && !!order && order.remaining > 0 && order.payments.length === 0,
    pay: () => checkout.mutate(),
    isPaying: checkout.isPending,
    paid: result?.status === 'paid',
    message,
  };
}
