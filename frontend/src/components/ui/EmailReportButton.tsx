import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  sendReportEmail,
  type ReportEmailType,
  type SendReportEmailData,
} from '../../api/reportEmail';
import './EmailReportButton.css';

interface EmailReportButtonProps {
  report: ReportEmailType;
  params?: Omit<SendReportEmailData, 'report' | 'recipient'>;
}

export default function EmailReportButton({
  report,
  params,
}: EmailReportButtonProps) {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const closeModal = () => {
    if (loading) return;

    setIsOpen(false);
    setRecipient('');
    setMessage('');
    setError('');
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const email = recipient.trim();

    if (!email) {
      setError(t('reportEmail.required'));
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setError(t('reportEmail.invalid'));
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await sendReportEmail({
        recipient: email,
        report,
        ...params,
      });

      setMessage(response.message);
      setRecipient('');
    } catch (requestError: any) {
      const backendMessage =
        requestError?.response?.data?.message;

      setError(
        Array.isArray(backendMessage)
          ? backendMessage.join(', ')
          : backendMessage || t('reportEmail.error'),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="email-report-button"
        onClick={() => {
          setIsOpen(true);
          setMessage('');
          setError('');
        }}
      >
        {t('reportEmail.button')}
      </button>

      {isOpen && (
        <div
          className="email-report-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="email-report-modal">
            <div className="email-report-header">
              <h2>{t('reportEmail.title')}</h2>

              <button
                type="button"
                className="email-report-close"
                onClick={closeModal}
                disabled={loading}
                aria-label={t('reportEmail.close')}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label htmlFor={`report-email-${report}`}>
                {t('reportEmail.recipient')}
              </label>

              <input
                id={`report-email-${report}`}
                type="email"
                value={recipient}
                onChange={(event) => {
                  setRecipient(event.target.value);
                  setError('');
                  setMessage('');
                }}
                placeholder={t('reportEmail.placeholder')}
                autoComplete="email"
                disabled={loading}
                autoFocus
              />

              {error && (
                <p className="email-report-error" role="alert">
                  {error}
                </p>
              )}

              {message && (
                <p className="email-report-success" role="status">
                  {message}
                </p>
              )}

              <div className="email-report-actions">
                <button
                  type="button"
                  className="email-report-cancel"
                  onClick={closeModal}
                  disabled={loading}
                >
                  {t('reportEmail.cancel')}
                </button>

                <button
                  type="submit"
                  className="email-report-submit"
                  disabled={loading}
                >
                  {loading
                    ? t('reportEmail.sending')
                    : t('reportEmail.send')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
