import { ConflictException, HttpException, HttpStatus } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { PrismaService } from '../prisma/prisma.service';
import type { StorageService } from '../storage/storage.service';
import { AuthService } from './auth.service';
import type { RegisterDto } from './dto/register.dto';

const NEW_ACCOUNT: RegisterDto = {
  username: 'Pedro.Perez',
  email: 'Pedro@BNS.cu',
  password: 'pelota2026',
};

type Existing = { username?: boolean; email?: boolean };

function createService(existing: Existing = {}) {
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(1),
    app_user: {
      findFirst: jest.fn(
        ({ where }: { where: { username?: unknown; email?: unknown } }) =>
          Promise.resolve(
            (where.username && existing.username) ||
              (where.email && existing.email)
              ? { user_id: 99 }
              : null,
          ),
      ),
      create: jest.fn(({ data }: { data: Record<string, unknown> }) =>
        Promise.resolve({
          user_id: 7,
          username: data.username,
          email: data.email,
          active: true,
          role_id: data.role_id,
          photo_url: null,
          role: { name: 'User' },
        }),
      ),
    },
    role: {
      findUnique: jest.fn().mockResolvedValue({ role_id: 2, name: 'User' }),
    },
  };

  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('token') };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as unknown as JwtService,
    {} as StorageService,
  );

  return { service, tx, jwt };
}

describe('AuthService.register', () => {
  it('crea la cuenta con el rol User, el email en minúsculas y la contraseña cifrada, e inicia sesión', async () => {
    const { service, tx, jwt } = createService();

    const result = await service.register(NEW_ACCOUNT, '10.0.0.1');

    expect(tx.role.findUnique).toHaveBeenCalledWith({
      where: { name: 'User' },
    });
    const { data } = tx.app_user.create.mock.calls[0][0] as {
      data: {
        username: string;
        email: string;
        password_hash: string;
        role_id: number;
      };
    };
    expect(data).toMatchObject({
      username: 'Pedro.Perez',
      email: 'pedro@bns.cu',
      role_id: 2,
    });
    expect(data.password_hash).not.toBe(NEW_ACCOUNT.password);
    await expect(
      bcrypt.compare(NEW_ACCOUNT.password, data.password_hash),
    ).resolves.toBe(true);

    expect(jwt.signAsync).toHaveBeenCalledWith({
      sub: 7,
      username: 'Pedro.Perez',
      role_id: 2,
      role: 'User',
    });
    expect(result).toEqual({
      accessToken: 'token',
      user: {
        user_id: 7,
        username: 'Pedro.Perez',
        email: 'pedro@bns.cu',
        active: true,
        role_id: 2,
        role: 'User',
        photo_url: null,
      },
    });
  });

  it('comprueba usuario y email sin distinguir mayúsculas, bajo el bloqueo de registro', async () => {
    const { service, tx } = createService();

    await service.register(NEW_ACCOUNT, '10.0.0.1');

    expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
    expect(tx.app_user.findFirst).toHaveBeenCalledWith({
      where: { username: { equals: 'Pedro.Perez', mode: 'insensitive' } },
      select: { user_id: true },
    });
    expect(tx.app_user.findFirst).toHaveBeenCalledWith({
      where: { email: { equals: 'pedro@bns.cu', mode: 'insensitive' } },
      select: { user_id: true },
    });
  });

  it('rechaza un nombre de usuario ya usado (409) sin crear nada', async () => {
    const { service, tx } = createService({ username: true });

    await expect(service.register(NEW_ACCOUNT)).rejects.toThrow(
      new ConflictException('Ese nombre de usuario ya está en uso'),
    );
    expect(tx.app_user.create).not.toHaveBeenCalled();
  });

  it('rechaza un email ya registrado (409) sin crear nada', async () => {
    const { service, tx } = createService({ email: true });

    await expect(service.register(NEW_ACCOUNT)).rejects.toThrow(
      new ConflictException('Ya existe una cuenta con ese email'),
    );
    expect(tx.app_user.create).not.toHaveBeenCalled();
  });

  it('tras 10 intentos en una hora bloquea ese origen (429), y no a los demás', async () => {
    const { service } = createService({ username: true });

    for (let attempt = 0; attempt < 10; attempt++) {
      await expect(
        service.register(NEW_ACCOUNT, '10.0.0.1'),
      ).rejects.toBeInstanceOf(ConflictException);
    }

    const blocked = await service
      .register(NEW_ACCOUNT, '10.0.0.1')
      .catch((error: unknown) => error);

    expect(blocked).toBeInstanceOf(HttpException);
    expect((blocked as HttpException).getStatus()).toBe(
      HttpStatus.TOO_MANY_REQUESTS,
    );
    expect((blocked as HttpException).message).toBe(
      'Demasiados intentos de registro desde este origen. Inténtalo de nuevo en 60 minutos',
    );
    await expect(
      service.register(NEW_ACCOUNT, '10.0.0.2'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
