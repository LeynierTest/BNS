/**
 * Reglas del registro público de cuentas (espejo en
 * frontend/src/auth/registration-rules.ts).
 *
 * - Nombre de usuario: 3 a 50 caracteres; letras sin tilde, números, punto,
 *   guion y guion bajo (sin espacios, para que se pueda escribir igual al
 *   iniciar sesión).
 * - Contraseña: 8 a 72 caracteres con al menos una letra y un número. 72 es
 *   lo que bcrypt tiene en cuenta: el resto se ignoraría sin avisar.
 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;
export const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

export const EMAIL_MAX_LENGTH = 150;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_PATTERN = /^(?=.*\p{L})(?=.*\d)/u;
