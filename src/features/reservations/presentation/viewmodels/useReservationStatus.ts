import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import type { ReservationStatus } from '../../domain/entities/Reservation';
import { REASON_REQUIRED } from '../../domain/usecases/ChangeReservationStatusUseCase';
import { reservationQueryKeys } from './reservationQueryKeys';

/** ViewModel de «Estado de …»: mismo diálogo que la web (estado y, al cancelar, el motivo). */
export function useReservationStatus(
  id: string,
  current: string,
  onSaved: (status: ReservationStatus) => void,
) {
  const { changeReservationStatusUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState(current);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState<string | undefined>();
  const cancelling = status === 'cancelada';

  const save = useMutation({
    mutationFn: () => changeReservationStatusUseCase.execute(id, status as ReservationStatus, reason),
    onSuccess: async () => {
      feedback.success();
      await queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all });
      onSaved(status as ReservationStatus);
    },
    onError: () => feedback.error(),
  });

  return {
    status,
    select: (next: string) => {
      feedback.select();
      setStatus(next);
    },
    cancelling,
    reason,
    setReason: (text: string) => {
      setReason(text);
      if (reasonError) setReasonError(undefined);
    },
    reasonError,
    unchanged: status === current,
    submit: () => {
      if (cancelling && reason.trim().length < 3) {
        setReasonError(REASON_REQUIRED);
        return;
      }
      save.mutate();
    },
    isSaving: save.isPending,
    error: save.error ? userMessage(save.error, 'No se pudo cambiar el estado.') : null,
  };
}
