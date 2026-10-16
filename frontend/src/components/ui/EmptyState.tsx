import type { ReactNode } from 'react';
import './EmptyState.css';

type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="ui-empty-state">
      <div className="ui-empty-state-icon" aria-hidden="true">
        —
      </div>

      <h3>{title}</h3>

      {description && (
        <p>{description}</p>
      )}

      {action && (
        <div className="ui-empty-state-action">
          {action}
        </div>
      )}
    </div>
  );
}