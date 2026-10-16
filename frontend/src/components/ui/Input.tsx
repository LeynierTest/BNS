import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import './Input.css';

type InputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    hint?: ReactNode;
    error?: ReactNode;
  };

export const Input = forwardRef<
  HTMLInputElement,
  InputProps
>(function Input(
  {
    id,
    label,
    hint,
    error,
    required,
    className = '',
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;

  const describedBy = [
    hint ? hintId : '',
    error ? errorId : '',
  ]
    .filter(Boolean)
    .join(' ');

  const inputClasses = [
    'ui-input',
    error ? 'has-error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ui-input-field">
      {label && (
        <label
          className="ui-input-label"
          htmlFor={inputId}
        >
          {label}

          {required && (
            <span
              className="ui-input-required"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      <input
        {...props}
        ref={ref}
        id={inputId}
        className={inputClasses}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          describedBy || undefined
        }
      />

      {error ? (
        <span
          id={errorId}
          className="ui-input-error"
          role="alert"
        >
          {error}
        </span>
      ) : hint ? (
        <span
          id={hintId}
          className="ui-input-hint"
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
});