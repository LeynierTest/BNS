import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeasonProvider } from '../../season/season-provider';
import { useSeason } from '../../season/use-season';
import { seasonLabel } from '../../types/season';
import { ErrorMessage } from '../ui/ErrorMessage';
import { LoadingState } from '../ui/LoadingState';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Sidebar } from './Sidebar';
import './AppLayout.css';

export function AppLayout() {
  return (
    <SeasonProvider>
      <AppShell />
    </SeasonProvider>
  );
}

function AppShell() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { selectedSeason, loading, error } = useSeason();

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

          <div className="app-header-actions">
            {selectedSeason && (
              <span
                className="app-header-season"
                title={t('seasons.changeInDashboard')}
              >
                {t('seasons.viewing')}: {seasonLabel(selectedSeason)}
              </span>
            )}

            <LanguageSwitcher />
          </div>
        </header>

        <main className="app-content">
          {/* Las páginas trabajan sobre la temporada elegida: se muestran
              cuando ya hay una. */}
          {selectedSeason ? (
            <Outlet />
          ) : loading ? (
            <LoadingState message={t('seasons.loading')} />
          ) : (
            <ErrorMessage message={error ?? t('seasons.empty')} />
          )}
        </main>
      </div>
    </div>
  );
}
