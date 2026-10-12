import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import type { Credentials } from '../../domain/repositories/AuthRepository';
import { validateCredentials } from '../../domain/usecases/LoginUseCase';
import { useSessionStore } from '../store/sessionStore';
import { errorMessage } from './errorMessage';

/** ViewModel de la pantalla de Login: estado del formulario + llamada al caso de uso. */
export function useLogin() {
  const { loginUseCase } = useDependencies();
  const setSession = useSessionStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (credentials: Credentials) => loginUseCase.execute(credentials),
    onSuccess: (session) => {
      setPassword('');
      setSession(session);
    },
  });

  function submit() {
    if (mutation.isPending) return;
    const invalid = validateCredentials({ email, password });
    setFormError(invalid);
    if (invalid) return;
    mutation.mutate({ email, password });
  }

  return {
    email,
    password,
    setEmail,
    setPassword,
    submit,
    isLoading: mutation.isPending,
    error: formError ?? (mutation.error ? errorMessage(mutation.error) : null),
  };
}
