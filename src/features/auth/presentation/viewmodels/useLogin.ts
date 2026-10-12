import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import { AppError } from '../../../../core/errors/AppError';
import { validateCredentials, type CredentialsErrors } from '../../domain/entities/credentials';

/** ViewModel de la pantalla de Login: estado del formulario, validación y llamada al caso de uso. */
export function useLogin() {
  const { loginUseCase, sessionStore } = useDependencies();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<CredentialsErrors>({});

  const mutation = useMutation({
    mutationFn: () => loginUseCase.execute({ email, password }),
    onSuccess: (session) => {
      setPassword('');
      sessionStore.getState().setSession(session);
    },
  });

  const submit = () => {
    const errors = validateCredentials({ email, password });
    setFieldErrors(errors);
    if (errors.email || errors.password) return;
    mutation.mutate();
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    fieldErrors,
    submit,
    isSubmitting: mutation.isPending,
    errorMessage: mutation.error ? loginErrorMessage(mutation.error) : null,
  };
}

function loginErrorMessage(error: Error): string {
  return error instanceof AppError ? error.message : 'No se pudo iniciar sesión. Inténtalo de nuevo.';
}
