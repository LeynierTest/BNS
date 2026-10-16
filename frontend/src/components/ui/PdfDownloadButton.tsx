import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { ErrorMessage } from './ErrorMessage';
import { getApiErrorMessage } from '../../api/api-error';
import { downloadReportPdf } from '../../api/reports';
import './PdfDownloadButton.css';

type PdfDownloadButtonProps = {
  endpoint: string;
  filename: string;
};

export function PdfDownloadButton({
  endpoint,
  filename,
}: PdfDownloadButtonProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setLoading(true);
    setError('');

    try {
      await downloadReportPdf(endpoint, filename);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          t('reportPdf.error'),
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pdf-download-button">
      <Button
        type="button"
        variant="secondary"
        loading={loading}
        onClick={handleDownload}
      >
        {loading
          ? t('reportPdf.generating')
          : t('reportPdf.download')}
      </Button>

      {error ? <ErrorMessage message={error} /> : null}
    </div>
  );
}
