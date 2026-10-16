import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Sidebar } from './Sidebar';
import './AppLayout.css';

export function AppLayout() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`mobile-menu-button ${
          sidebarOpen ? 'is-hidden' : ''
        }`}
        onClick={() => setSidebarOpen(true)}
        aria-label="Abrir menú"
        aria-expanded={sidebarOpen}
      >
        <Menu size={24} />
      </button>

      <div
        className={`mobile-sidebar-overlay ${
          sidebarOpen ? 'is-visible' : ''
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <div
        className={`app-sidebar-container ${
          sidebarOpen ? 'is-open' : ''
        }`}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <div className="app-main">
        <header className="app-header">
          <div>
            <span className="app-header-eyebrow">
              {t('header.league')}
            </span>

            <h1>{t('header.title')}</h1>
          </div>

          <LanguageSwitcher />
        </header>

        <main className="app-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
