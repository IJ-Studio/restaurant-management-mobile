import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';

type Props =
  | { kind: 'loading'; message?: string }
  | { kind: 'error'; message: string; onRetry?: () => void }
  | { kind: 'empty'; message: string };

/** Estados de pantalla comunes: cargando, error con reintento y vacío. */
export function ScreenState(props: Props) {
  switch (props.kind) {
    case 'loading':
      return <LoadingState message={props.message} />;
    case 'error':
      return <ErrorState message={props.message} onRetry={props.onRetry} />;
    case 'empty':
      return <EmptyState message={props.message} />;
  }
}
