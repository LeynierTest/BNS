import { useState } from 'react';
import type { FormEvent, InputHTMLAttributes, ReactNode } from 'react';
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserPlus,
  UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '../api/api-error';
import { useAuth } from '../auth/use-auth';
import {
  normalizeRegistration,
  validateRegistration,
} from '../auth/registration-rules';
import type {
  RegistrationErrors,
  RegistrationForm,
} from '../auth/registration-rules';
import { AuthShell } from '../components/layout/AuthShell';

const EMPTY_FORM: RegistrationForm = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
};

type RegisterFieldProps = {
  name: keyof RegistrationForm;
  label: string;
  icon: LucideIcon;
  error?: string;
  hint?: string;
  trailing?: ReactNode;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'name'>;

function RegisterField({
  name,
  label,
  icon: Icon,
  error,
  hint,
  trailing,
  ...inputProps
}: RegisterFieldProps) {
  const id = `register-${name}`;
  const describedBy = error
    ? `${id}-error`
    : hint
      ? `${id}-hint`
      : undefined;

  return (
    <div className="login-field">
      <label htmlFor={id}>{label}</label>

      <div className="login-input-wrapper">
        <Icon
          className="login-input-icon"
          size={18}
          aria-hidden="true"
        />

        <input
          id={id}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...inputProps}
        />

        {trailing}
      </div>

      {error ? (
        <p id={`${id}-error`} className="login-field-error">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="login-field-hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/**
 * Registro público: cualquiera crea su cuenta con el rol User y entra
 * directamente. Las cuentas de administrador siguen creándose desde Usuarios.
 */
export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, register } = useAuth();
  const { t } = useTranslation();

  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && !loading) {
    return <Navigate to="/dashboard" replace />;
  }

  function updateField(name: keyof RegistrationForm, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    if (error) setError('');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateRegistration(form);
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register(normalizeRegistration(form));
      navigate('/dashboard', { replace: true });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, t('register.error')));
      setLoading(false);
    }
  }

  const fieldError = (name: keyof RegistrationForm) => {
    const key = fieldErrors[name];
    return key ? t(key) : undefined;
  };

  const passwordType = showPassword ? 'text' : 'password';

  return (
    <AuthShell>
      <div className="login-header">
        <div className="login-header-icon" aria-hidden="true">
          <UserPlus size={20} strokeWidth={2} />
        </div>

        <p className="login-kicker">{t('register.kicker')}</p>

        <h2>{t('register.title')}</h2>

        <p className="login-description">{t('register.description')}</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit} noValidate>
        <RegisterField
          name="username"
          label={t('register.username')}
          icon={UserRound}
          type="text"
          value={form.username}
          onChange={(event) => updateField('username', event.target.value)}
          autoComplete="username"
          placeholder={t('register.usernamePlaceholder')}
          maxLength={50}
          disabled={loading}
          error={fieldError('username')}
          hint={t('register.usernameHint')}
          required
        />

        <RegisterField
          name="email"
          label={t('register.email')}
          icon={Mail}
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          autoComplete="email"
          placeholder={t('register.emailPlaceholder')}
          maxLength={150}
          disabled={loading}
          error={fieldError('email')}
          required
        />

        <RegisterField
          name="password"
          label={t('register.password')}
          icon={LockKeyhole}
          type={passwordType}
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          autoComplete="new-password"
          placeholder={t('register.passwordPlaceholder')}
          maxLength={72}
          disabled={loading}
          error={fieldError('password')}
          hint={t('register.passwordHint')}
          required
          trailing={
            <button
              type="button"
              className="login-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
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
          }
        />

        <RegisterField
          name="confirmPassword"
          label={t('register.confirmPassword')}
          icon={LockKeyhole}
          type={passwordType}
          value={form.confirmPassword}
          onChange={(event) =>
            updateField('confirmPassword', event.target.value)
          }
          autoComplete="new-password"
          placeholder={t('register.confirmPasswordPlaceholder')}
          maxLength={72}
          disabled={loading}
          error={fieldError('confirmPassword')}
          required
        />

        {error && (
          <div className="login-error" role="alert" aria-live="polite">
            <span className="login-error-indicator" />
            <p>{error}</p>
          </div>
        )}

        <button className="login-submit" type="submit" disabled={loading}>
          {loading ? (
            <>
              <span className="login-spinner" />
              {t('register.loading')}
            </>
          ) : (
            <>
              {t('register.submit')}
              <UserPlus size={18} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="login-switch">
        {t('register.haveAccount')}{' '}
        <Link to="/login">{t('register.signIn')}</Link>
      </p>
    </AuthShell>
  );
}
