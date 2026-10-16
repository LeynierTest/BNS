import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import './Button.css';

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger';

type ButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    children: ReactNode;
    loading?: boolean;
  };

export function Button({
  variant = 'primary',
  children,
  loading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const classes = [
    'ui-button',
    `ui-button-${variant}`,
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {loading ? (
        <span
          className="ui-button-spinner"
          aria-hidden="true"
        />
      ) : null}

      <span>{children}</span>
    </button>
  );
}