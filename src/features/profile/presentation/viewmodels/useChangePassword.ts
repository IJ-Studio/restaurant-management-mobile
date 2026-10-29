import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { useSession } from '../../../auth/presentation/viewmodels/useSession';
import {
  hasErrors,
  PASSWORD_RULES,
  validatePasswordChange,
  type PasswordChange,
  type PasswordErrors,
} from '../../domain/entities/Profile';

const EMPTY: PasswordChange = { current: '', next: '', confirm: '' };

/** ViewModel de Cambiar contraseña: requisitos en vivo, validación y envío. */
export function useChangePassword() {
  const { changePasswordUseCase } = useDependencies();
  const userId = useSession((state) => state.session?.user.id ?? '');
  const [form, setForm] = useState<PasswordChange>(EMPTY);
  const [errors, setErrors] = useState<PasswordErrors>({});

  const change = useMutation({
    mutationFn: () => changePasswordUseCase.execute(userId, form),
    onSuccess: () => {
      feedback.success();
      // No se dejan contraseñas en memoria más de lo necesario.
      setForm(EMPTY);
    },
    onError: () => feedback.error(),
  });

  return {
    form,
    update: (field: keyof PasswordChange, value: string) => {
      setForm((current) => ({ ...current, [field]: value }));
      if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
    },
    errors,
    rules: PASSWORD_RULES.map((rule) => ({ label: rule.label, met: rule.test(form.next) })),
    submit: () => {
      const found = validatePasswordChange(form);
      setErrors(found);
      if (!hasErrors(found)) change.mutate();
    },
    isSaving: change.isPending,
    done: change.isSuccess,
    saveError: change.error ? userMessage(change.error, 'No se pudo cambiar la contraseña.') : null,
  };
}
