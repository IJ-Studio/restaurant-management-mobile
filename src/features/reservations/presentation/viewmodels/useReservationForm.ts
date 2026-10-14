import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import type {
  CreatedReservation,
  NewReservation,
  ReservationChannel,
} from '../../domain/entities/Reservation';
import {
  hasErrors,
  MAX_PARTY_SIZE,
  MIN_ADVANCE_MS,
  validateReservation,
  type ReservationErrors,
} from '../../domain/entities/reservationRules';
import { reservationQueryKeys } from './reservationQueryKeys';
import { reservationErrorMessage } from './useActiveReservations';

interface FormState {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  dateTime: Date | null;
  partySize: number;
  occasion: string;
  specialRequests: string;
  channel: ReservationChannel;
}

const INITIAL: FormState = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  dateTime: null,
  partySize: 2,
  occasion: '',
  specialRequests: '',
  channel: 'telefono',
};

/** ViewModel del formulario: valida en el cliente antes de enviar y refresca el listado al guardar. */
export function useReservationForm(onCreated?: (result: CreatedReservation) => void) {
  const { createReservationUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<ReservationErrors>({});
  // Primer horario que acepta el API, calculado una sola vez al abrir el formulario.
  const [minimumDate] = useState(() => new Date(Date.now() + MIN_ADVANCE_MS));

  const mutation = useMutation({
    mutationFn: (draft: NewReservation) => createReservationUseCase.execute(draft),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all });
      setForm(INITIAL);
      onCreated?.(result);
    },
  });

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const changePartySize = (delta: number) =>
    update('partySize', Math.min(MAX_PARTY_SIZE, Math.max(1, form.partySize + delta)));

  const submit = () => {
    const draft: NewReservation = {
      ...form,
      dateTime: form.dateTime ?? new Date(Number.NaN),
      occasion: form.occasion || undefined,
      specialRequests: form.specialRequests || undefined,
    };
    const errors = validateReservation(draft);
    setFieldErrors(errors);
    if (!hasErrors(errors)) mutation.mutate(draft);
  };

  return {
    form,
    minimumDate,
    update,
    changePartySize,
    fieldErrors,
    submit,
    isSubmitting: mutation.isPending,
    errorMessage: mutation.error ? reservationErrorMessage(mutation.error) : null,
  };
}
