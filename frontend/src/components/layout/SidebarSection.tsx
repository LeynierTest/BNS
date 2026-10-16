import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';
import './SidebarSection.css';

interface SidebarSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function SidebarSection({
  title,
  children,
  defaultOpen = false,
}: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="sidebar-section">
      <button
        type="button"
        className="sidebar-section-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="app-nav-section-title">
          {title}
        </span>

        <ChevronDown
          size={16}
          strokeWidth={1.9}
          className={`sidebar-section-chevron ${
            open ? 'is-open' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      <div
        className={`sidebar-section-items ${
          open ? 'is-open' : 'is-closed'
        }`}
      >
        {children}
      </div>
    </section>
  );
}
