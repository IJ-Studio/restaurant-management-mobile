import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import {
  chargeSummary,
  parseAmount,
  tipFromPercent,
  validateCharge,
  type PaymentMethod,
} from '../../domain/entities/Payment';
import { orderQueryKeys, refreshOrderData } from './orderQueryKeys';

/** Billetes con los que suele pagar el cliente, para sugerir montos de un toque. */
const BILLS = [50, 100, 200, 500, 1000];

/** Montos rápidos: el exacto y los siguientes redondeos a billetes, sin repetir. */
export function cashSuggestions(toPay: number): number[] {
  const rounded = BILLS.map((bill) => Math.ceil(toPay / bill) * bill);
  return [...new Set([toPay, ...rounded])].filter((amount) => amount >= toPay).slice(0, 4);
}

/** ViewModel de la pantalla de cobro en caja. */
export function useCharge(orderId: string) {
  const deps = useDependencies();
  const queryClient = useQueryClient();
  const [methodId, setMethodId] = useState<number | null>(null);
  const [tipPercent, setTipPercent] = useState<number | null>(0);
  const [customTip, setCustomTip] = useState('');
  const [receivedText, setReceivedText] = useState('');
  const [reference, setReference] = useState('');

  const order = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => deps.getOrderDetailUseCase.execute(orderId),
  });
  const methods = useQuery({
    queryKey: orderQueryKeys.paymentMethods,
    queryFn: () => deps.listPaymentMethodsUseCase.execute(),
    staleTime: 10 * 60 * 1000,
  });

  const available = methods.data ?? [];
  // Mientras no elijan, se propone el primero (efectivo va primero).
  const method: PaymentMethod | undefined = available.find((m) => m.id === methodId) ?? available[0];
  const total = order.data?.total ?? 0;

  const tip =
    method?.allowsTip === false
      ? 0
      : tipPercent === null
        ? Math.max(0, parseAmount(customTip) || 0)
        : tipFromPercent(total, tipPercent);
  const received = method?.kind === 'cash' ? parseAmount(receivedText) : undefined;
  const receivedValue = received !== undefined && Number.isFinite(received) ? received : undefined;
  const summary = chargeSummary(total, tip, method, receivedValue);

  const charge = useMutation({
    mutationFn: () =>
      deps.chargeOrderUseCase.execute({ id: orderId, total }, method, {
        tip,
        received: receivedValue,
        reference: reference.trim() || undefined,
      }),
    onSuccess: () => {
      feedback.success();
      return refreshOrderData(queryClient);
    },
    onError: () => feedback.error(),
  });

  const problem = order.data
    ? validateCharge(total, { methodId: method?.id ?? 0, tip, received: receivedValue }, method)
    : null;

  return {
    order: order.data,
    methods: available,
    method,
    isLoading: order.isPending || methods.isPending,
    loadError: order.error
      ? userMessage(order.error, 'No se pudo cargar el pedido.')
      : methods.error
        ? userMessage(methods.error, 'No se pudieron cargar los métodos de pago.')
        : null,
    retry: () => Promise.all([order.refetch(), methods.refetch()]),
    selectMethod: (id: number) => {
      feedback.select();
      setMethodId(id);
    },
    tip,
    tipPercent,
    selectTipPercent: (percent: number) => {
      setTipPercent(percent);
      setCustomTip('');
    },
    customTip,
    setCustomTip: (text: string) => {
      setTipPercent(null);
      setCustomTip(text);
    },
    receivedText,
    setReceivedText,
    suggestions: cashSuggestions(summary.toPay),
    reference,
    setReference,
    summary,
    /** Por qué todavía no se puede cobrar (se muestra junto al botón). */
    problem,
    submit: () => charge.mutate(),
    isCharging: charge.isPending,
    receipt: charge.data,
    chargeError: charge.error ? userMessage(charge.error, 'No se pudo registrar el pago.') : null,
  };
}
