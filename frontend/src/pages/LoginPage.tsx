import { useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, LockKeyhole, LogIn, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../auth/use-auth';
import { AuthShell } from '../components/layout/AuthShell';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = error.response?.data?.message;

        setError(
          Array.isArray(message)
            ? message.join(', ')
            : message ?? t('login.error'),
        );
      } else {
        setError(t('login.error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <div className="login-header">
        <div className="login-header-icon" aria-hidden="true">
          <LogIn size={20} strokeWidth={2} />
        </div>

        <p className="login-kicker">
          {t('login.kicker')}
        </p>

        <h2>{t('login.title')}</h2>

        <p className="login-description">
          {t('login.description')}
        </p>
      </div>

      <form
        className="login-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="login-field">
          <label htmlFor="username">
            {t('login.username')}
          </label>

          <div className="login-input-wrapper">
            <UserRound
              className="login-input-icon"
              size={18}
              aria-hidden="true"
            />

            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => {
                setUsername(event.target.value);
                if (error) setError('');
              }}
              autoComplete="username"
              placeholder={t('login.usernamePlaceholder')}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="login-field">
          <label htmlFor="password">
            {t('login.password')}
          </label>

          <div className="login-input-wrapper">
            <LockKeyhole
              className="login-input-icon"
              size={18}
              aria-hidden="true"
            />

            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (error) setError('');
              }}
              autoComplete="current-password"
              placeholder={t('login.passwordPlaceholder')}
              disabled={loading}
              required
            />

            <button
              type="button"
              className="login-password-toggle"
              onClick={() =>
                setShowPassword((current) => !current)
              }
              aria-label={
                showPassword
                  ? t('login.hidePassword')
                  : t('login.showPassword')
              }
              title={
                showPassword
                  ? t('login.hidePassword')
                  : t('login.showPassword')
              }
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {error && (
          <div
            className="login-error"
            role="alert"
            aria-live="polite"
          >
            <span className="login-error-indicator" />
            <p>{error}</p>
          </div>
        )}

        <button
          className="login-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="login-spinner" />
              {t('login.loading')}
            </>
          ) : (
            <>
              {t('login.submit')}
              <LogIn size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="login-switch">
        {t('login.noAccount')}{' '}
        <Link to="/register">{t('login.createAccount')}</Link>
      </p>

      <p className="login-security-note">
        <LockKeyhole size={14} aria-hidden="true" />
        {t('login.securityNote')}
      </p>
    </AuthShell>
  );
}
