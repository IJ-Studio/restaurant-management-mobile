import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { errorMessage } from '../../../../shared/presentation/errorMessage';
import { toLocalDateInput } from '../../../../shared/presentation/format';
import type { Reservation } from '../../domain/entities/Reservation';
import {
  validateReservation,
  type ReservationDraft,
  type ReservationErrors,
  type ReservationField,
} from '../../domain/entities/reservationRules';
import { reservationQueryKeys } from './reservationQueryKeys';

export function emptyDraft(now = new Date()): ReservationDraft {
  return {
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    date: toLocalDateInput(now),
    time: '',
    partySize: '2',
    notes: '',
  };
}

/** ViewModel del formulario: valida antes de enviar y refresca el listado al crear. */
export function useReservationForm(onCreated: (reservation: Reservation) => void, now: () => Date = () => new Date()) {
  const { createReservationUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ReservationDraft>(() => emptyDraft(now()));
  const [errors, setErrors] = useState<ReservationErrors>({});

  const mutation = useMutation({
    mutationFn: (value: ReservationDraft) => createReservationUseCase.execute(value),
    onSuccess: async (reservation) => {
      await queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all });
      onCreated(reservation);
    },
  });

  function setField(field: ReservationField, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
  }

  function submit() {
    if (mutation.isPending) return;
    const result = validateReservation(draft, now());
    setErrors(result.errors);
    if (!result.value) return;
    mutation.mutate(draft);
  }

  return {
    draft,
    errors,
    setField,
    submit,
    isSubmitting: mutation.isPending,
    submitError: mutation.error ? errorMessage(mutation.error) : null,
  };
}
