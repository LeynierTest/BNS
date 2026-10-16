import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Resuelve una ruta relativa devuelta por el backend
 * (por ejemplo `/uploads/avatars/xyz.webp`) contra la
 * URL base de la API. Las URLs absolutas se devuelven
 * tal cual.
 */
export function resolveAssetUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl =
    import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`;

  return `${normalizedBase}${normalizedPath}`;
}

export default api;
