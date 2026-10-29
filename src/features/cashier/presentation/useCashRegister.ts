import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../core/di/DependenciesProvider';
import { userMessage } from '../../../core/errors/AppError';
import { feedback } from '../../../shared/presentation/feedback';
import { parseAmount } from '../../orders/domain/entities/Payment';
import { cashDifference } from '../domain/CashRegister';

export const cashQueryKey = ['cash-register', 'current'] as const;

/** ViewModel del corte de caja: turno abierto, apertura con fondo y cierre con conteo. */
export function useCashRegister() {
  const { getCashSessionUseCase, openCashRegisterUseCase, closeCashRegisterUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [floatText, setFloatText] = useState('');
  const [countedText, setCountedText] = useState('');
  const [notes, setNotes] = useState('');

  const session = useQuery({
    queryKey: cashQueryKey,
    queryFn: () => getCashSessionUseCase.execute(),
    refetchInterval: 60 * 1000,
  });

  const open = useMutation({
    mutationFn: () => openCashRegisterUseCase.execute(parseAmount(floatText || '0')),
    onSuccess: (opened) => {
      feedback.success();
      setFloatText('');
      queryClient.setQueryData(cashQueryKey, opened);
    },
    onError: () => feedback.error(),
  });

  const close = useMutation({
    mutationFn: () => closeCashRegisterUseCase.execute(parseAmount(countedText), notes),
    onSuccess: () => {
      feedback.success();
      setCountedText('');
      setNotes('');
      queryClient.setQueryData(cashQueryKey, null);
    },
    onError: () => feedback.error(),
  });

  const current = session.data ?? null;
  const counted = parseAmount(countedText);
  const difference =
    current && Number.isFinite(counted) ? cashDifference(current.expectedCash, counted) : undefined;

  let errorMessage: string | null = null;
  if (open.error) errorMessage = userMessage(open.error, open.error.message || 'No se pudo abrir la caja.');
  else if (close.error)
    errorMessage = userMessage(close.error, close.error.message || 'No se pudo cerrar la caja.');

  return {
    session: current,
    isLoading: session.isPending,
    loadError: session.error ? userMessage(session.error, 'No se pudo consultar tu caja.') : null,
    refresh: () => session.refetch(),
    isRefreshing: session.isRefetching,
    floatText,
    setFloatText,
    openRegister: () => open.mutate(),
    isOpening: open.isPending,
    countedText,
    setCountedText,
    notes,
    setNotes,
    difference,
    closeRegister: () => close.mutate(),
    isClosing: close.isPending,
    closed: close.data,
    dismissClosed: () => close.reset(),
    errorMessage,
  };
}
