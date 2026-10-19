import { describe, expect, it } from 'vitest';
import {
  normalizeRegistration,
  validateRegistration,
} from './registration-rules';

const VALID = {
  username: 'Pedro.Perez',
  email: 'pedro@bns.cu',
  password: 'pelota2026',
  confirmPassword: 'pelota2026',
};

describe('validateRegistration', () => {
  it('acepta un formulario válido', () => {
    expect(validateRegistration(VALID)).toEqual({});
  });

  it('exige usuario de 3 a 50 caracteres sin espacios ni tildes', () => {
    expect(validateRegistration({ ...VALID, username: 'pe' }).username).toBe(
      'register.validation.usernameLength',
    );
    expect(
      validateRegistration({ ...VALID, username: 'a'.repeat(51) }).username,
    ).toBe('register.validation.usernameLength');
    expect(
      validateRegistration({ ...VALID, username: 'Pedro Pérez' }).username,
    ).toBe('register.validation.usernamePattern');
    // Los espacios a los lados no cuentan.
    expect(
      validateRegistration({ ...VALID, username: '  pedro_1  ' }).username,
    ).toBeUndefined();
  });

  it('exige un email con formato válido', () => {
    expect(validateRegistration({ ...VALID, email: ' ' }).email).toBe(
      'register.validation.emailRequired',
    );
    expect(validateRegistration({ ...VALID, email: 'pedro@' }).email).toBe(
      'register.validation.emailInvalid',
    );
  });

  it('exige contraseña de 8 a 72 caracteres con letras y números', () => {
    const withPassword = (password: string) =>
      validateRegistration({
        ...VALID,
        password,
        confirmPassword: password,
      }).password;

    expect(withPassword('corta1')).toBe('register.validation.passwordLength');
    expect(withPassword(`a1${'x'.repeat(71)}`)).toBe(
      'register.validation.passwordLength',
    );
    expect(withPassword('sinnumeros')).toBe(
      'register.validation.passwordPattern',
    );
    expect(withPassword('12345678')).toBe(
      'register.validation.passwordPattern',
    );
    expect(withPassword('ñandú2026')).toBeUndefined();
  });

  it('exige repetir la misma contraseña', () => {
    expect(
      validateRegistration({ ...VALID, confirmPassword: '' }).confirmPassword,
    ).toBe('register.validation.confirmRequired');
    expect(
      validateRegistration({ ...VALID, confirmPassword: 'pelota2025' })
        .confirmPassword,
    ).toBe('register.validation.confirmMismatch');
  });
});

describe('normalizeRegistration', () => {
  it('quita espacios a usuario y email y no envía la confirmación', () => {
    expect(
      normalizeRegistration({
        ...VALID,
        username: ' Pedro.Perez ',
        email: ' pedro@bns.cu ',
      }),
    ).toEqual({
      username: 'Pedro.Perez',
      email: 'pedro@bns.cu',
      password: 'pelota2026',
    });
  });
});
