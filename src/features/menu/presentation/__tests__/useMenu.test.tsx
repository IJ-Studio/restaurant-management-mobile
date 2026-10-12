import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { AppError } from '../../../../core/errors/AppError';
import { AppProviders } from '../../../../core/providers/AppProviders';
import { makeTestDependencies } from '../../../../core/testing/makeTestDependencies';
import { makeMenu } from '../../__fixtures__/menu';
import { useMenu } from '../viewmodels/useMenu';

function setup(execute: jest.Mock) {
  const deps = makeTestDependencies({ getMenuUseCase: { execute } });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AppProviders dependencies={deps} queryClient={queryClient}>
      {children}
    </AppProviders>
  );
  return renderHook(() => useMenu(), { wrapper });
}

describe('useMenu', () => {
  it('pasa de cargando a mostrar el menú', async () => {
    let resolve: (value: unknown) => void = () => {};
    const { result } = await setup(jest.fn(() => new Promise((r) => (resolve = r))));

    expect(result.current.isLoading).toBe(true);
    resolve(makeMenu());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sections.map((s) => s.name)).toEqual(['Platos fuertes', 'Bebidas']);
  });

  it('expone el mensaje de error del caso de uso', async () => {
    const { result } = await setup(
      jest.fn().mockRejectedValue(new AppError('network', 'No hay conexión con el servidor.')),
    );

    await waitFor(() => expect(result.current.errorMessage).toBe('No hay conexión con el servidor.'));
    expect(result.current.hasData).toBe(false);
  });

  it('usa un mensaje genérico ante errores inesperados', async () => {
    const { result } = await setup(jest.fn().mockRejectedValue(new Error('boom')));
    await waitFor(() => expect(result.current.errorMessage).toBe('No se pudo cargar el menú.'));
  });

  it('filtra con la búsqueda sin volver a llamar al API', async () => {
    const execute = jest.fn().mockResolvedValue(makeMenu());
    const { result } = await setup(execute);
    await waitFor(() => expect(result.current.hasData).toBe(true));

    await act(async () => result.current.setSearch('mole'));

    expect(result.current.sections).toHaveLength(1);
    expect(result.current.sections[0].dishes.map((d) => d.name)).toEqual(['Mole poblano']);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
