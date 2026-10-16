import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import './ForbiddenPage.css';

export function ForbiddenPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <main className="status-page">
      <div className="status-page-card">
        <span className="status-page-code">403</span>

        <h1>{t('errors.forbiddenTitle')}</h1>

        <p>{t('errors.forbiddenDescription')}</p>

        <Button onClick={() => navigate('/dashboard')}>
          {t('errors.backToDashboard')}
        </Button>
      </div>
    </main>
  );
}
