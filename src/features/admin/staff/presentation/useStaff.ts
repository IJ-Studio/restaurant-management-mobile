import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { StaffValidationError, type StaffErrors, type StaffInput, type StaffMember } from '../domain/Staff';

type Message = { tone: 'success' | 'danger'; text: string } | null;
const fullName = (u: StaffMember) => `${u.name} ${u.lastname}`.trim();

/** ViewModel del personal: lista (con los dados de baja), alta, edición, rol, baja y reactivación. */
export function useStaff() {
  const { staffRepository, saveStaffUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<Message>(null);
  const [fieldErrors, setFieldErrors] = useState<StaffErrors>({});
  const staff = useQuery({ queryKey: ['admin-staff'], queryFn: () => staffRepository.list() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-staff'] });

  const run = useMutation({
    mutationFn: (job: () => Promise<string>) => job(),
    onSuccess: (text) => {
      feedback.success();
      setFieldErrors({});
      setMessage({ tone: 'success', text });
      void refresh();
    },
    onError: (e: Error) => {
      feedback.error();
      if (e instanceof StaffValidationError) {
        setFieldErrors(e.errors);
        setMessage(null);
        return;
      }
      setMessage({
        tone: 'danger',
        text: userMessage(
          e,
          'No se pudo guardar. Revisa que el correo no esté ya en uso y vuelve a intentarlo.',
        ),
      });
    },
  });
  const go = (job: () => Promise<string>) =>
    run.mutateAsync(job).then(
      () => true,
      () => false,
    );

  return {
    staff: staff.data ?? [],
    isLoading: staff.isLoading,
    error: staff.error ? userMessage(staff.error, 'No se pudo cargar el personal.') : null,
    refresh,
    message,
    fieldErrors,
    clearErrors: () => setFieldErrors({}),
    busy: run.isPending,
    save: (input: StaffInput, original?: StaffMember) =>
      go(() =>
        saveStaffUseCase
          .execute(input, original)
          .then(() => (original ? 'Cambios guardados.' : 'Usuario creado.')),
      ),
    toggle: (u: StaffMember) =>
      go(() =>
        (u.active ? staffRepository.deactivate(u.id) : staffRepository.reactivate(u.id)).then(() =>
          u.active ? `Usuario desactivado: ${fullName(u)}.` : `Usuario activado: ${fullName(u)}.`,
        ),
      ),
  };
}
