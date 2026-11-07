import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import {
  hasErrors,
  validateProfile,
  type ProfileChanges,
  type ProfileErrors,
  type UserProfile,
} from '../../domain/entities/Profile';

export const profileQueryKey = (userId: string) => ['profile', userId] as const;

/** Datos actuales del perfil (GET /users/:id) para llenar el formulario. */
export function useProfileDetails() {
  const { getProfileUseCase } = useDependencies();
  const userId = useSession((state) => state.session?.user.id ?? '');

  const query = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => getProfileUseCase.execute(userId),
    enabled: userId !== '',
  });

  return {
    profile: query.data,
    isLoading: query.isPending,
    loadError: query.error ? userMessage(query.error, 'No se pudo cargar tu perfil.') : null,
    retry: () => query.refetch(),
  };
}

/** ViewModel del formulario de Editar perfil: arranca con los datos ya cargados, valida y guarda. */
export function useEditProfile(initial: UserProfile, onSaved: () => void) {
  const { updateProfileUseCase, sessionStore } = useDependencies();
  const session = useSession((state) => state.session);
  const [form, setForm] = useState<ProfileChanges>({
    name: initial.name,
    lastname: initial.lastname,
    phone: initial.phone ?? '',
  });
  const [errors, setErrors] = useState<ProfileErrors>({});

  const save = useMutation({
    mutationFn: () => {
      if (!session) throw new Error('Vuelve a iniciar sesión.');
      return updateProfileUseCase.execute(session, form);
    },
    onSuccess: ({ session: updated }) => {
      feedback.success();
      sessionStore.getState().setSession(updated);
      onSaved();
    },
    onError: () => feedback.error(),
  });

  return {
    form,
    email: initial.email,
    update: (field: keyof ProfileChanges, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
      if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    },
    errors,
    submit: () => {
      const found = validateProfile(form);
      setErrors(found);
      if (!hasErrors(found)) save.mutate();
    },
    isSaving: save.isPending,
    saveError: save.error ? userMessage(save.error, 'No se pudieron guardar los cambios.') : null,
  };
}
