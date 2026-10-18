import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AxiosError, AxiosHeaders } from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../auth/auth-context';
import type { AuthContextValue } from '../auth/auth-context';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';

function renderAuthPages(
  path: string,
  overrides: Partial<AuthContextValue> = {},
) {
  const auth: AuthContextValue = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    register: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    updatePhoto: vi.fn(),
    removePhoto: vi.fn(),
    ...overrides,
  };

  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<p>Panel principal</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );

  return auth;
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function fillValidForm() {
  fill('Usuario', '  Pedro.Perez ');
  fill('Email', 'pedro@bns.cu');
  fill('Contraseña', 'pelota2026');
  fill('Confirmar contraseña', 'pelota2026');
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));
}

describe('Crear cuenta desde el login', () => {
  it('el login enlaza con la página de registro', () => {
    renderAuthPages('/login');

    fireEvent.click(screen.getByRole('link', { name: 'Crear cuenta' }));

    expect(
      screen.getByRole('heading', { name: 'Crea tu cuenta' }),
    ).toBeTruthy();
  });

  it('registra con los datos normalizados y entra al Dashboard', async () => {
    const auth = renderAuthPages('/register');

    fillValidForm();
    submit();

    expect(await screen.findByText('Panel principal')).toBeTruthy();
    expect(auth.register).toHaveBeenCalledWith({
      username: 'Pedro.Perez',
      email: 'pedro@bns.cu',
      password: 'pelota2026',
    });
  });

  it('valida antes de llamar a la API y marca los campos con error', () => {
    const auth = renderAuthPages('/register');

    fill('Usuario', 'Pedro Pérez');
    fill('Email', 'pedro@');
    fill('Contraseña', 'sinnumeros');
    fill('Confirmar contraseña', 'otra');
    submit();

    expect(auth.register).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'Usa solo letras sin tilde, números, punto, guion o guion bajo.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('El email no es válido.')).toBeTruthy();
    expect(
      screen.getByText(
        'La contraseña debe tener al menos una letra y un número.',
      ),
    ).toBeTruthy();
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeTruthy();
    expect(
      screen.getByLabelText('Email').getAttribute('aria-invalid'),
    ).toBe('true');
  });

  it('muestra el mensaje del backend si el registro se rechaza', async () => {
    const conflict = new AxiosError(
      'Conflict',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      {
        status: 409,
        statusText: 'Conflict',
        headers: {},
        config: { headers: new AxiosHeaders() },
        data: { message: 'Ese nombre de usuario ya está en uso' },
      },
    );
    renderAuthPages('/register', {
      register: vi.fn().mockRejectedValue(conflict),
    });

    fillValidForm();
    submit();

    expect(
      await screen.findByText('Ese nombre de usuario ya está en uso'),
    ).toBeTruthy();
    await waitFor(() =>
      expect(
        screen
          .getByRole('button', { name: 'Crear cuenta' })
          .hasAttribute('disabled'),
      ).toBe(false),
    );
  });

  it('con la sesión ya iniciada, la página de registro lleva al Dashboard', () => {
    renderAuthPages('/register', { isAuthenticated: true });

    expect(screen.getByText('Panel principal')).toBeTruthy();
  });
});
