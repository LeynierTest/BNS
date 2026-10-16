import type { LucideIcon } from 'lucide-react';
import './SidebarAction.css';

interface SidebarActionProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

export function SidebarAction({
  label,
  icon: Icon,
  onClick,
}: SidebarActionProps) {
  return (
    <button
      type="button"
      className="app-logout-button"
      onClick={onClick}
    >
      <Icon
        size={17}
        strokeWidth={1.9}
        aria-hidden="true"
      />

      <span>{label}</span>
    </button>
  );
}
