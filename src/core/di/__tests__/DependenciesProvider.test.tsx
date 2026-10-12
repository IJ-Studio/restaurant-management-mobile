import { renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { HttpClient } from '../../http/httpClient';
import { DependenciesProvider, useDependencies } from '../DependenciesProvider';
import type { Dependencies } from '../dependencies';

describe('DependenciesProvider', () => {
  it('entrega las dependencias inyectadas (mocks en pruebas)', async () => {
    const mock = { httpClient: {} as HttpClient } as Dependencies;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DependenciesProvider value={mock}>{children}</DependenciesProvider>
    );

    const { result } = await renderHook(() => useDependencies(), { wrapper });
    expect(result.current).toBe(mock);
  });

  it('construye las implementaciones reales si no se inyecta nada', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DependenciesProvider>{children}</DependenciesProvider>
    );

    const { result } = await renderHook(() => useDependencies(), { wrapper });
    expect(result.current.httpClient).toBeInstanceOf(HttpClient);
  });

  it('avisa si se usa fuera del provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(renderHook(() => useDependencies())).rejects.toThrow('<DependenciesProvider>');
  });
});
