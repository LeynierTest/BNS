import type {
  HTMLAttributes,
  ReactNode,
} from 'react';
import './Badge.css';

type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'danger'
  | 'accent';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

export function Badge({
  variant = 'neutral',
  children,
  className = '',
  ...props
}: BadgeProps) {
  const classes = [
    'ui-badge',
    `ui-badge-${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      {...props}
      className={classes}
    >
      {children}
    </span>
  );
}