import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { currentWeek, type MovementType, type Period } from '../domain/Payroll';

/** ViewModel de la nómina del admin: neto del periodo, sumar o restar e historial con correcciones. */
export function usePayroll(initial: Period = currentWeek()) {
  const { payrollRepository, addPayrollMovementUseCase, correctPayrollMovementUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState(initial);
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const key = ['payroll', period.start, period.end] as const;

  const summary = useQuery({
    queryKey: [...key, 'summary'],
    queryFn: () => payrollRepository.summary(period),
  });
  const movements = useQuery({
    queryKey: [...key, 'movements'],
    queryFn: () => payrollRepository.movements(period),
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: key });

  const add = useMutation({
    mutationFn: (m: {
      employeeId: string;
      type: MovementType;
      concept: string;
      amount: number;
      justification: string;
    }) => addPayrollMovementUseCase.execute({ ...m, period }),
    onSuccess: () => {
      feedback.success();
      setMessage({ tone: 'success', text: 'Movimiento registrado.' });
      void refresh();
    },
    onError: (e: Error) => {
      feedback.error();
      setMessage({ tone: 'danger', text: userMessage(e, 'No se pudo registrar.') });
    },
  });

  const correct = useMutation({
    mutationFn: (v: { id: number; justification: string }) =>
      correctPayrollMovementUseCase.execute(v.id, v.justification),
    onSuccess: () => {
      feedback.success();
      setMessage({ tone: 'success', text: 'Corrección registrada: se añadió el movimiento inverso.' });
      void refresh();
    },
    onError: (e: Error) => {
      feedback.error();
      setMessage({ tone: 'danger', text: userMessage(e, 'No se pudo corregir.') });
    },
  });

  return {
    period,
    setPeriod,
    summary: summary.data ?? [],
    movements: movements.data ?? [],
    isLoading: summary.isLoading || movements.isLoading,
    error:
      summary.error || movements.error
        ? userMessage(summary.error ?? movements.error, 'No se pudo cargar la nómina.')
        : null,
    refresh,
    message,
    busy: add.isPending || correct.isPending,
    add: (m: Parameters<typeof add.mutateAsync>[0]) =>
      add.mutateAsync(m).then(
        () => true,
        () => false,
      ),
    correct: (id: number, justification: string) =>
      correct.mutateAsync({ id, justification }).then(
        () => true,
        () => false,
      ),
  };
}
