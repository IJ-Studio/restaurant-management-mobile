import { createContext, useContext, useState, type ReactNode } from 'react';

import { createDependencies, type Dependencies } from './dependencies';

const DependenciesContext = createContext<Dependencies | null>(null);

interface Props {
  children: ReactNode;
  /** En pruebas se pasan mocks; en la app se construyen las implementaciones reales. */
  value?: Dependencies;
}

export function DependenciesProvider({ children, value }: Props) {
  const [dependencies] = useState(() => value ?? createDependencies());
  return <DependenciesContext.Provider value={dependencies}>{children}</DependenciesContext.Provider>;
}

export function useDependencies(): Dependencies {
  const dependencies = useContext(DependenciesContext);
  if (!dependencies) {
    throw new Error('useDependencies debe usarse dentro de <DependenciesProvider>.');
  }
  return dependencies;
}
