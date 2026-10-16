import type {
  ButtonHTMLAttributes,
  ReactNode,
} from 'react';
import './IconButton.css';

type IconButtonVariant =
  | 'neutral'
  | 'danger';

type IconButtonProps =
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    children: ReactNode;
    variant?: IconButtonVariant;
  };

export function IconButton({
  label,
  children,
  variant = 'neutral',
  className = '',
  ...props
}: IconButtonProps) {
  const classes = [
    'ui-icon-button',
    `ui-icon-button-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...props}
      type={props.type ?? 'button'}
      className={classes}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}