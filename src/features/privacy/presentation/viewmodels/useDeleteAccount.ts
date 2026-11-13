import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { userMessage } from '../../../../core/errors/AppError';
import { feedback } from '../../../../shared/presentation/feedback';
import { PASSWORD_REQUIRED } from '../../domain/usecases/DeleteAccountUseCase';

export const ACCOUNT_DELETED_NOTICE = 'Tu cuenta se eliminó.';

/** ViewModel de Eliminar cuenta: pide la contraseña y, al terminar, vuelve al Login con el aviso. */
export function useDeleteAccount() {
  const { deleteAccountUseCase, sessionStore } = useDependencies();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const remove = useMutation({
    mutationFn: () => deleteAccountUseCase.execute(password),
    onSuccess: () => sessionStore.getState().expireSession(ACCOUNT_DELETED_NOTICE),
    onError: () => feedback.error(),
  });

  return {
    password,
    setPassword: (value: string) => {
      setPassword(value);
      setPasswordError(undefined);
    },
    passwordError,
    /** `false` si falta la contraseña: la pantalla no debe pedir la confirmación. */
    validate: (): boolean => {
      if (password) return true;
      setPasswordError(PASSWORD_REQUIRED);
      return false;
    },
    confirm: () => remove.mutate(),
    isDeleting: remove.isPending,
    error: remove.error ? userMessage(remove.error, 'No se pudo eliminar la cuenta.') : null,
  };
}
