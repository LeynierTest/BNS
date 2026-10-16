import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import './SidebarItem.css';

interface SidebarItemProps {
  label: string;
  path: string;
  icon: LucideIcon;
  onNavigate?: () => void;
}

export function SidebarItem({
  label,
  path,
  icon: Icon,
  onNavigate,
}: SidebarItemProps) {
  return (
    <NavLink
      to={path}
      onClick={onNavigate}
      className={({ isActive }) =>
        `app-nav-link ${isActive ? 'is-active' : ''}`
      }
    >
      <span className="app-nav-icon" aria-hidden="true">
        <Icon
          size={18}
          strokeWidth={1.9}
        />
      </span>

      <span>{label}</span>
    </NavLink>
  );
}
