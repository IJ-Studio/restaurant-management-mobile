import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import type {
  CreatedReservation,
  NewReservation,
  ReservationChannel,
} from '../../domain/entities/Reservation';
import { DEFAULT_RULES } from '../../domain/entities/OperationRules';
import {
  hasErrors,
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
  const { createReservationUseCase, operationRules, reservationTables } = useDependencies();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<ReservationErrors>({});
  // Reglas del API (horario, antelación, personas); sin conexión, los valores por defecto del servidor.
  const rulesQuery = useQuery({
    queryKey: ['operation-rules'],
    queryFn: () => operationRules.get(),
    staleTime: 5 * 60 * 1000,
  });
  const rules = rulesQuery.data ?? DEFAULT_RULES;
  // Primer horario que acepta el API, desde que se abre el formulario.
  const [openedAt] = useState(() => Date.now());
  const minimumDate = useMemo(
    () => new Date(openedAt + rules.minAdvanceMin * 60_000),
    [openedAt, rules.minAdvanceMin],
  );

  // Mesas libres para esa fecha y personas; sin elegir, el API asigna la primera con lugar.
  const [tableId, setTableId] = useState<number | undefined>();
  const tablesQuery = useQuery({
    queryKey: ['free-tables', form.dateTime?.getTime(), form.partySize],
    queryFn: () => reservationTables.freeTables(form.dateTime as Date, form.partySize, rules.utcOffsetMin),
    enabled: form.dateTime !== null,
    staleTime: 30 * 1000,
  });

  const mutation = useMutation({
    mutationFn: (draft: NewReservation) => createReservationUseCase.execute(draft, rules),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: reservationQueryKeys.all });
      setForm(INITIAL);
      setTableId(undefined);
      onCreated?.(result);
    },
  });

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    // Otra fecha u otro número de personas cambia qué mesas están libres.
    if (field === 'dateTime' || field === 'partySize') setTableId(undefined);
    setForm((current) => ({ ...current, [field]: value }));
  };

  const changePartySize = (delta: number) =>
    update('partySize', Math.min(rules.maxPartySize, Math.max(1, form.partySize + delta)));

  const submit = () => {
    const draft: NewReservation = {
      ...form,
      dateTime: form.dateTime ?? new Date(Number.NaN),
      occasion: form.occasion || undefined,
      specialRequests: form.specialRequests || undefined,
      tableId,
    };
    const errors = validateReservation(draft, new Date(), rules);
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
    freeTables: tablesQuery.data ?? [],
    tablesLoading: tablesQuery.isFetching,
    tableId,
    selectTable: setTableId,
  };
}
