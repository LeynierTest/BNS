/**
 * Validación del formulario de registro antes de llamar a la API. Espejo de
 * backend/src/auth/registration-rules.ts (el backend vuelve a validar).
 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export const EMAIL_MAX_LENGTH = 150;
// Comprobación básica; la definitiva (IsEmail) es la del backend.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_PATTERN = /^(?=.*\p{L})(?=.*\d)/u;

/** Cuerpo de POST /auth/register. */
export type RegistrationData = {
  username: string;
  email: string;
  password: string;
};

export type RegistrationForm = RegistrationData & {
  confirmPassword: string;
};

/** Clave de traducción del error de cada campo. */
export type RegistrationErrors = Partial<
  Record<keyof RegistrationForm, string>
>;

/** Usuario y email sin espacios a los lados; la contraseña, tal cual. */
export function normalizeRegistration(
  form: RegistrationForm,
): RegistrationData {
  return {
    username: form.username.trim(),
    email: form.email.trim(),
    password: form.password,
  };
}

export function validateRegistration(
  form: RegistrationForm,
): RegistrationErrors {
  const { username, email, password } = normalizeRegistration(form);
  const errors: RegistrationErrors = {};

  if (
    username.length < USERNAME_MIN_LENGTH ||
    username.length > USERNAME_MAX_LENGTH
  ) {
    errors.username = 'register.validation.usernameLength';
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username = 'register.validation.usernamePattern';
  }

  if (!email) {
    errors.email = 'register.validation.emailRequired';
  } else if (
    email.length > EMAIL_MAX_LENGTH ||
    !EMAIL_PATTERN.test(email)
  ) {
    errors.email = 'register.validation.emailInvalid';
  }

  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH
  ) {
    errors.password = 'register.validation.passwordLength';
  } else if (!PASSWORD_PATTERN.test(password)) {
    errors.password = 'register.validation.passwordPattern';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'register.validation.confirmRequired';
  } else if (form.confirmPassword !== password) {
    errors.confirmPassword = 'register.validation.confirmMismatch';
  }

  return errors;
}
