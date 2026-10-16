import type {
  HTMLAttributes,
  ReactNode,
} from 'react';
import './Card.css';

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: 'article' | 'section' | 'div';
};

export function Card({
  children,
  as = 'article',
  className = '',
  ...props
}: CardProps) {
  const Component = as;

  const classes = ['ui-card', className]
    .filter(Boolean)
    .join(' ');

  return (
    <Component
      {...props}
      className={classes}
    >
      {children}
    </Component>
  );
}