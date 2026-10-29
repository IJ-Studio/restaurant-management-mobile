import type { ReactNode } from 'react';

import { ErrorState } from '../../../../shared/presentation/components/ErrorState';
import { canAccess, type Section } from '../../domain/entities/permissions';
import { useSession } from '../viewmodels/useSession';

/** Segunda barrera además de no registrar la ruta: si el rol no tiene la sección, no se renderiza. */
export function RequireSection({ section, children }: { section: Section; children: ReactNode }) {
  const role = useSession((state) => state.session?.user.role);

  if (!canAccess(role, section)) return <ErrorState message="No tienes acceso a esta sección." />;
  return <>{children}</>;
}
