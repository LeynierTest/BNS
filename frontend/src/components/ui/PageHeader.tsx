import type { ReactNode } from 'react';
import './PageHeader.css';

type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="ui-page-header">
      <div className="ui-page-header-content">
        {eyebrow && (
          <span className="ui-page-header-eyebrow">
            {eyebrow}
          </span>
        )}

        <h1 className="ui-page-header-title">
          {title}
        </h1>

        {description && (
          <p className="ui-page-header-description">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="ui-page-header-actions">
          {actions}
        </div>
      )}
    </header>
  );
}