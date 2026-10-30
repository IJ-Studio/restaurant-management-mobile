import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import {
  chargeSummary,
  equalShare,
  itemsAmount,
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

/** Cómo se divide la cuenta: completa, en partes iguales o por los platillos de cada quien. */
export type SplitMode = 'full' | 'equal' | 'items';

const MAX_LABEL = 60;

/** Texto corto de los platillos que paga una persona ("2× Mole, 1× Café"). */
function itemsLabel(picked: { name: string; quantity: number }[]): string {
  const text = picked.map((item) => `${item.quantity}× ${item.name}`).join(', ');
  return text.length > MAX_LABEL ? `${text.slice(0, MAX_LABEL - 1)}…` : text;
}

/** Propina de este pago: por porcentaje del importe o el monto que escribió el cajero. */
function computeTip(
  method: PaymentMethod | undefined,
  base: number,
  tipPercent: number | null,
  customTip: string,
): number {
  if (method?.allowsTip === false) return 0;
  if (tipPercent === null) return Math.max(0, parseAmount(customTip) || 0);
  return tipFromPercent(base, tipPercent);
}

/** Importe y etiqueta de este pago según cómo se divide la cuenta. */
function splitAmount(
  mode: SplitMode,
  remaining: number,
  equal: { person: number; split: number; peopleLeft: number },
  pickedItems: { name: string; unitPrice: number; quantity: number }[],
): { base: number; label?: string } {
  if (mode === 'equal') {
    return {
      base: equalShare(remaining, equal.peopleLeft),
      label: `Persona ${equal.person} de ${equal.split}`,
    };
  }
  if (mode === 'items') {
    return {
      base: Math.min(remaining, itemsAmount(pickedItems)),
      label: pickedItems.length > 0 ? itemsLabel(pickedItems) : undefined,
    };
  }
  return { base: remaining };
}

/** ViewModel de la pantalla de cobro en caja, con cuenta separada. */
export function useCharge(orderId: string) {
  const deps = useDependencies();
  const queryClient = useQueryClient();
  const [methodId, setMethodId] = useState<number | null>(null);
  const [tipPercent, setTipPercent] = useState<number | null>(0);
  const [customTip, setCustomTip] = useState('');
  const [receivedText, setReceivedText] = useState('');
  const [reference, setReference] = useState('');
  const [mode, setMode] = useState<SplitMode>('full');
  const [people, setPeople] = useState<number | null>(null);
  const [picked, setPicked] = useState<Record<number, number>>({});

  const order = useQuery({
    queryKey: orderQueryKeys.detail(orderId),
    queryFn: () => deps.getOrderDetailUseCase.execute(orderId),
  });
  const methods = useQuery({
    queryKey: orderQueryKeys.paymentMethods,
    queryFn: () => deps.listPaymentMethodsUseCase.execute(),
    staleTime: 10 * 60 * 1000,
  });

  const detail = order.data;
  const available = methods.data ?? [];
  // Mientras no elijan, se propone el primero (efectivo va primero).
  const method: PaymentMethod | undefined = available.find((m) => m.id === methodId) ?? available[0];
  const remaining = detail?.remaining ?? 0;

  // Partes iguales: la persona que sigue es la siguiente a los pagos ya registrados.
  const split = Math.max(2, people ?? detail?.guests ?? 2);
  const paidCount = detail?.payments.length ?? 0;
  const person = Math.min(split, paidCount + 1);
  const peopleLeft = Math.max(1, split - paidCount);

  const pickedItems = (detail?.items ?? [])
    .filter((item) => (picked[item.id] ?? 0) > 0)
    .map((item) => ({ name: item.name, unitPrice: item.unitPrice, quantity: picked[item.id] }));

  const { base, label } = splitAmount(mode, remaining, { person, split, peopleLeft }, pickedItems);

  const tip = computeTip(method, base, tipPercent, customTip);
  const received = method?.kind === 'cash' ? parseAmount(receivedText) : undefined;
  const receivedValue = received !== undefined && Number.isFinite(received) ? received : undefined;
  const summary = chargeSummary(base, tip, method, receivedValue);

  const charge = useMutation({
    mutationFn: () =>
      deps.chargeOrderUseCase.execute({ id: orderId, remaining }, method, {
        tip,
        amount: mode === 'full' ? undefined : base,
        label,
        received: receivedValue,
        reference: reference.trim() || undefined,
      }),
    onSuccess: () => {
      feedback.success();
      void refreshOrderData(queryClient);
    },
    onError: () => feedback.error(),
  });

  let problem: string | null = null;
  if (detail && mode === 'items' && pickedItems.length === 0) {
    problem = 'Elige los platillos que paga esta persona.';
  } else if (detail) {
    problem = validateCharge(base, { methodId: method?.id ?? 0, tip, received: receivedValue }, method);
  }

  let loadError: string | null = null;
  if (order.error) loadError = userMessage(order.error, 'No se pudo cargar el pedido.');
  else if (methods.error)
    loadError = userMessage(methods.error, 'No se pudieron cargar los métodos de pago.');

  return {
    order: detail,
    methods: available,
    method,
    isLoading: order.isPending || methods.isPending,
    loadError,
    retry: () => Promise.all([order.refetch(), methods.refetch()]),
    selectMethod: (id: number) => {
      feedback.select();
      setMethodId(id);
    },
    // Cuenta separada
    mode,
    selectMode: (next: SplitMode) => {
      feedback.select();
      setMode(next);
      setPicked({});
    },
    people: split,
    setPeople: (value: number) => setPeople(Math.min(20, Math.max(2, value))),
    person,
    peopleLeft,
    picked,
    pick: (itemId: number, quantity: number, max: number) =>
      setPicked((current) => ({ ...current, [itemId]: Math.min(max, Math.max(0, quantity)) })),
    base,
    label,
    // Propina y pago
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
    /** Después de un pago parcial: limpia el formulario para la siguiente persona. */
    nextPerson: () => {
      charge.reset();
      setReceivedText('');
      setReference('');
      setTipPercent(0);
      setCustomTip('');
      setPicked({});
      void order.refetch();
    },
  };
}
