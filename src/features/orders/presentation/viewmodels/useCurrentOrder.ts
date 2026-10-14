import { useStore } from 'zustand';

import { useDependencies } from '../../../../core/di/DependenciesProvider';
import type { CurrentOrderState } from '../store/currentOrderStore';

export function useCurrentOrder<T>(selector: (state: CurrentOrderState) => T): T {
  const { currentOrderStore } = useDependencies();
  return useStore(currentOrderStore, selector);
}
