import {
  forwardRef,
  useId,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react';
import './Select.css';

export type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

type SelectProps =
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    hint?: ReactNode;
    error?: ReactNode;
    options: SelectOption[];
    placeholder?: string;
  };

export const Select = forwardRef<
  HTMLSelectElement,
  SelectProps
>(function Select(
  {
    id,
    label,
    hint,
    error,
    options,
    placeholder,
    required,
    className = '',
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;

  const describedBy = [
    hint ? hintId : '',
    error ? errorId : '',
  ]
    .filter(Boolean)
    .join(' ');

  const selectClasses = [
    'ui-select',
    error ? 'has-error' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="ui-select-field">
      {label && (
        <label
          className="ui-select-label"
          htmlFor={selectId}
        >
          {label}

          {required && (
            <span
              className="ui-select-required"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      <div className="ui-select-wrapper">
        <select
          {...props}
          ref={ref}
          id={selectId}
          className={selectClasses}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            describedBy || undefined
          }
        >
          {placeholder && (
            <option value="">
              {placeholder}
            </option>
          )}

          {options.map((option) => (
            <option
              key={String(option.value)}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <span
          id={errorId}
          className="ui-select-error"
          role="alert"
        >
          {error}
        </span>
      ) : hint ? (
        <span
          id={hintId}
          className="ui-select-hint"
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
});