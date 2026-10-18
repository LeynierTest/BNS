const DEFAULT_FRONTEND_ORIGIN = 'http://localhost:5173';

/**
 * Orígenes del frontend autorizados para CORS y para mutaciones
 * autenticadas con cookie. Se configura con FRONTEND_ORIGIN (admite
 * varios separados por comas); por defecto, el servidor de Vite.
 */
export function getAllowedOrigins(): string[] {
  const configured =
    process.env.FRONTEND_ORIGIN ?? DEFAULT_FRONTEND_ORIGIN;

  return configured
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter((origin) => origin !== '');
}
