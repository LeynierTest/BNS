import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

type Language = 'es' | 'en';

type LanguageSwitcherProps = {
  variant?: 'default' | 'login';
};

const STORAGE_KEY = 'bnsm_language';

export function LanguageSwitcher({
  variant = 'default',
}: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const currentLanguage: Language =
    i18n.resolvedLanguage === 'en' ? 'en' : 'es';

  async function handleLanguageChange(
    nextLanguage: Language,
  ) {
    await i18n.changeLanguage(nextLanguage);

    localStorage.setItem(
      STORAGE_KEY,
      nextLanguage,
    );

    document.documentElement.lang = nextLanguage;
  }

  return (
    <div
      className={
        variant === 'login'
          ? 'language-switcher language-switcher-login'
          : 'language-switcher'
      }
      aria-label={t('common.language')}
    >
      <Languages
        className="language-switcher-icon"
        size={17}
        strokeWidth={1.9}
        aria-hidden="true"
      />

      <div
        className="language-switcher-options"
        role="group"
        aria-label={t('common.language')}
      >
        <button
          type="button"
          className={
            currentLanguage === 'es'
              ? 'language-option is-active'
              : 'language-option'
          }
          onClick={() =>
            void handleLanguageChange('es')
          }
          aria-pressed={currentLanguage === 'es'}
          title={t('common.spanish')}
        >
          ES
        </button>

        <span
          className="language-divider"
          aria-hidden="true"
        >
          |
        </span>

        <button
          type="button"
          className={
            currentLanguage === 'en'
              ? 'language-option is-active'
              : 'language-option'
          }
          onClick={() =>
            void handleLanguageChange('en')
          }
          aria-pressed={currentLanguage === 'en'}
          title={t('common.english')}
        >
          EN
        </button>
      </div>
    </div>
  );
}
