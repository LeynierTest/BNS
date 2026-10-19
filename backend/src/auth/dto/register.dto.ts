import { IsEmail, IsString, Length, Matches, MaxLength } from 'class-validator';
import {
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_PATTERN,
} from '../registration-rules';

/**
 * Alta de una cuenta desde el login. No lleva rol: toda cuenta creada así es
 * "User" (el ValidationPipe rechaza cualquier campo extra, como `role`).
 */
export class RegisterDto {
  @IsString()
  @Length(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, {
    message: `El nombre de usuario debe tener entre ${USERNAME_MIN_LENGTH} y ${USERNAME_MAX_LENGTH} caracteres`,
  })
  @Matches(USERNAME_PATTERN, {
    message:
      'El nombre de usuario solo admite letras sin tilde, números, punto, guion y guion bajo',
  })
  username: string;

  @IsEmail({}, { message: 'El email no es válido' })
  @MaxLength(EMAIL_MAX_LENGTH, {
    message: `El email no puede superar ${EMAIL_MAX_LENGTH} caracteres`,
  })
  email: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: `La contraseña debe tener entre ${PASSWORD_MIN_LENGTH} y ${PASSWORD_MAX_LENGTH} caracteres`,
  })
  @Matches(PASSWORD_PATTERN, {
    message: 'La contraseña debe tener al menos una letra y un número',
  })
  password: string;
}
