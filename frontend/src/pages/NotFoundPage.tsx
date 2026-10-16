import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import './NotFoundPage.css';

export function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="status-page">
      <div className="status-page-card">
        <span className="status-page-code">404</span>

        <h1>{t('errors.notFoundTitle')}</h1>

        <p>{t('errors.notFoundDescription')}</p>

        <Button onClick={() => navigate('/dashboard')}>
          {t('errors.backToDashboard')}
        </Button>
      </div>
    </main>
  );
}
