import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import {
  EmployeeValidationError,
  type EmployeeErrors,
  type EmployeeInput,
  type PayrollEmployee,
} from '../domain/Employees';

/** ViewModel de los empleados de la nómina: alta, edición, activar o desactivar y quitar. */
export function useEmployees() {
  const { payrollEmployeesRepository, saveEmployeeUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<{ tone: 'success' | 'danger'; text: string } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EmployeeErrors>({});
  const employees = useQuery({
    queryKey: ['payroll-employees'],
    queryFn: () => payrollEmployeesRepository.list(),
  });
  // El neto del periodo depende de los empleados activos y su pago.
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['payroll-employees'] }),
      queryClient.invalidateQueries({ queryKey: ['payroll'] }),
    ]);

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
      if (e instanceof EmployeeValidationError) {
        setFieldErrors(e.errors);
        setMessage(null);
        return;
      }
      setMessage({
        tone: 'danger',
        text: userMessage(e, 'No se pudo guardar. Vuelve a intentarlo en un momento.'),
      });
    },
  });
  const go = (job: () => Promise<string>) =>
    run.mutateAsync(job).then(
      () => true,
      () => false,
    );

  return {
    employees: employees.data ?? [],
    isLoading: employees.isLoading,
    error: employees.error ? userMessage(employees.error, 'No se pudo cargar la nómina.') : null,
    refresh,
    message,
    fieldErrors,
    clearErrors: () => setFieldErrors({}),
    busy: run.isPending,
    save: (input: EmployeeInput, id?: string) =>
      go(() =>
        saveEmployeeUseCase
          .execute(input, id)
          .then(() => (id ? 'Cambios guardados.' : 'Añadido a la nómina.')),
      ),
    toggle: (e: PayrollEmployee) =>
      go(() =>
        payrollEmployeesRepository
          .update(e.id, { active: !e.active })
          .then(() =>
            e.active ? `${e.name} ya no cuenta en los totales.` : `${e.name} vuelve a contar en los totales.`,
          ),
      ),
    remove: (e: PayrollEmployee) =>
      go(() => payrollEmployeesRepository.remove(e.id).then(() => `${e.name} ya no está en la nómina.`)),
  };
}
