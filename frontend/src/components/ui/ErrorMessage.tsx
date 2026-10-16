import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import './ErrorMessage.css';

type ErrorMessageProps = {
  title?: ReactNode;
  message: ReactNode;
  action?: ReactNode;
};

export function ErrorMessage({
  title = 'Ha ocurrido un error',
  message,
  action,
}: ErrorMessageProps) {
  return (
    <div
      className="ui-error-message"
      role="alert"
    >
      <CircleAlert
        size={20}
        strokeWidth={1.9}
        aria-hidden="true"
      />

      <div className="ui-error-message-content">
        <strong>{title}</strong>
        <span>{message}</span>

        {action && (
          <div className="ui-error-message-action">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}