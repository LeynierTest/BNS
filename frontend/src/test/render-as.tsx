import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AuthContext } from '../auth/auth-context';
import type { AuthContextValue } from '../auth/auth-context';

/** Renderiza con una sesión iniciada con el rol indicado. */
export function renderAs(
  role: 'Administrator' | 'User',
  ui: ReactElement,
) {
  const value: AuthContextValue = {
    user: {
      user_id: 1,
      username: role === 'Administrator' ? 'admin' : 'usuario',
      email: 'prueba@bns.test',
      active: true,
      role_id: role === 'Administrator' ? 1 : 2,
      role,
      photo_url: null,
    },
    isAuthenticated: true,
    isLoading: false,
    login: async () => {},
    logout: async () => {},
    updatePhoto: async () => {},
    removePhoto: async () => {},
  };

  return render(
    <AuthContext.Provider value={value}>{ui}</AuthContext.Provider>,
  );
}
