import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './LanguageSwitcher';
import './AuthShell.css';

/**
 * Marco de las páginas sin sesión (iniciar sesión y crear cuenta): panel de
 * marca a la izquierda y el formulario a la derecha.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <main className="login-page">
      <div className="login-language">
        <LanguageSwitcher variant="login" />
      </div>

      <div className="login-shell">
        <section className="login-brand-panel">
          <div className="login-brand-content">
            <div className="login-brand-mark">
              <span>B</span>
              <span>N</span>
              <span>S</span>
              <span>M</span>
            </div>

            <p className="login-brand-eyebrow">
              {t('login.brandEyebrow')}
            </p>

            <h1>{t('login.brandTitle')}</h1>

            <p className="login-brand-description">
              {t('login.brandDescription')}
            </p>

            <div className="login-baseball-mark" aria-hidden="true">
              <div className="login-diamond">
                <span className="login-base first" />
                <span className="login-base second" />
                <span className="login-base third" />
                <span className="login-base home" />
              </div>
            </div>
          </div>

          <div className="login-brand-footer">
            <span>{t('login.brandFooter')}</span>
            <span className="login-brand-dot" />
            <span>BNSM</span>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-container">
            <div className="login-mobile-brand">
              <span className="login-mobile-logo">BNSM</span>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
