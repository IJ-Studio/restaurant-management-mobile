import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import type { AdminTable, TableInput } from '../domain/Tables';

type Message = { tone: 'success' | 'danger'; text: string } | null;

/** ViewModel de las mesas del admin: lista, alta/edición, activar o desactivar y baja. */
export function useTables() {
  const { tablesRepository, saveTableUseCase } = useDependencies();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<Message>(null);
  const tables = useQuery({ queryKey: ['admin-tables'], queryFn: () => tablesRepository.list() });
  const areas = useQuery({ queryKey: ['admin-tables', 'areas'], queryFn: () => tablesRepository.areas() });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-tables'] });

  const run = useMutation({
    mutationFn: (job: () => Promise<string>) => job(),
    onSuccess: (text) => {
      feedback.success();
      setMessage({ tone: 'success', text });
      void refresh();
    },
    onError: (e: Error) => {
      feedback.error();
      setMessage({ tone: 'danger', text: userMessage(e, 'No se pudo guardar la mesa.') });
    },
  });
  const go = (job: () => Promise<string>) =>
    run.mutateAsync(job).then(
      () => true,
      () => false,
    );

  return {
    tables: tables.data ?? [],
    areas: areas.data ?? [],
    isLoading: tables.isLoading,
    error: tables.error ? userMessage(tables.error, 'No se pudieron cargar las mesas.') : null,
    refresh,
    message,
    busy: run.isPending,
    save: (input: TableInput, id?: number) =>
      go(() =>
        saveTableUseCase
          .execute(input, id)
          .then(() => (id === undefined ? 'Mesa añadida.' : 'Mesa guardada.')),
      ),
    toggle: (t: AdminTable) =>
      go(() =>
        tablesRepository
          .update(t.id, { active: !t.active })
          .then(() => (t.active ? `Mesa ${t.number} desactivada.` : `Mesa ${t.number} activada.`)),
      ),
    remove: (t: AdminTable) => go(() => tablesRepository.remove(t.id).then((r) => r.message)),
  };
}
