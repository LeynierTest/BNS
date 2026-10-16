import { LoaderCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import './LoadingState.css';

type LoadingStateProps = {
  message?: ReactNode;
};

export function LoadingState({
  message = 'Cargando...',
}: LoadingStateProps) {
  return (
    <div
      className="ui-loading-state"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="ui-loading-spinner"
        size={22}
        strokeWidth={1.9}
        aria-hidden="true"
      />

      <span>{message}</span>
    </div>
  );
}