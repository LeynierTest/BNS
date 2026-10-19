import {
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import api from '../api/client';
import {
  AuthContext,
  type AuthUser,
} from './auth-context';
import type { RegistrationData } from './registration-rules';

type AuthResponse = {
  user: AuthUser;
};

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    async function restoreSession() {
      try {
        const response =
          await api.get<AuthResponse>('/auth/me');

        if (isActive) {
          setUser(response.data.user);
        }
      } catch {
        if (isActive) {
          setUser(null);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, []);

  async function login(
    username: string,
    password: string,
  ) {
    const response = await api.post<AuthResponse>(
      '/auth/login',
      {
        username,
        password,
      },
    );

    setUser(response.data.user);
  }

  async function register(data: RegistrationData) {
    const response = await api.post<AuthResponse>(
      '/auth/register',
      data,
    );

    setUser(response.data.user);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setUser(null);
    }
  }

  async function updatePhoto(photo: File) {
    const formData = new FormData();
    formData.append('photo', photo);

    const response = await api.post<AuthResponse>(
      '/auth/me/photo',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    );

    setUser(response.data.user);
  }

  async function removePhoto() {
    const response =
      await api.delete<AuthResponse>('/auth/me/photo');

    setUser(response.data.user);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      updatePhoto,
      removePhoto,
    }),
    [user, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
