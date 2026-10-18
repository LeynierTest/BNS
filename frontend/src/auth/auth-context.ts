import { createContext } from 'react';
import type { RegistrationData } from './registration-rules';

export type AuthUser = {
  user_id: number;
  username: string;
  email: string;
  active: boolean;
  role_id: number;
  role: string;
  photo_url: string | null;
};

export type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  /** Crea una cuenta User desde el login y deja su sesión iniciada. */
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  updatePhoto: (photo: File) => Promise<void>;
  removePhoto: () => Promise<void>;
};

export const AuthContext =
  createContext<AuthContextValue | undefined>(undefined);
