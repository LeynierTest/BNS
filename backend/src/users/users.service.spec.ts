import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { PrismaService } from '../prisma/prisma.service';
import { UsersService } from './users.service';

const ADMIN_ID = 1;
const OTHER_ADMIN_ID = 2;
const USER_ID = 3;

function userRow(userId: number, role: string, active = true) {
  return {
    user_id: userId,
    username: `user${userId}`,
    email: `user${userId}@bns.cu`,
    active,
    role_id: role === 'Administrator' ? 1 : 2,
    photo_url: null,
    role: { name: role },
  };
}

function createPrismaMock(activeAdministratorIds: number[]) {
  const tx = {
    $queryRaw: jest.fn().mockResolvedValue(
      activeAdministratorIds.map((user_id) => ({ user_id })),
    ),
    app_user: {
      update: jest.fn().mockResolvedValue(userRow(ADMIN_ID, 'User')),
      delete: jest.fn().mockResolvedValue(undefined),
    },
  };

  return {
    tx,
    prisma: {
      app_user: {
        findUnique: jest.fn(
          ({ where }: { where: { user_id: number } }) =>
            Promise.resolve(
              userRow(
                where.user_id,
                where.user_id === USER_ID ? 'User' : 'Administrator',
              ),
            ),
        ),
        create: jest.fn(),
      },
      role: {
        findUnique: jest.fn(({ where }: { where: { name: string } }) =>
          Promise.resolve({
            role_id: where.name === 'Administrator' ? 1 : 2,
            name: where.name,
          }),
        ),
      },
      $transaction: jest.fn(
        (callback: (client: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    },
  };
}

function serviceWith(activeAdministratorIds: number[]) {
  const mocks = createPrismaMock(activeAdministratorIds);

  return {
    ...mocks,
    service: new UsersService(
      mocks.prisma as unknown as PrismaService,
    ),
  };
}

describe('UsersService · invariante de administrador activo', () => {
  it('impide que el único administrador activo se quite el rol', async () => {
    const { service, tx } = serviceWith([ADMIN_ID]);

    await expect(
      service.updateUser(ADMIN_ID, { role: 'User' }, ADMIN_ID),
    ).rejects.toThrow(
      'No se puede quitar el rol ni desactivar al último Administrator activo del sistema',
    );
    expect(tx.app_user.update).not.toHaveBeenCalled();
  });

  it('permite degradar a un administrador si queda otro activo', async () => {
    const { service, tx } = serviceWith([ADMIN_ID, OTHER_ADMIN_ID]);

    await service.updateUser(ADMIN_ID, { role: 'User' }, ADMIN_ID);

    expect(tx.app_user.update).toHaveBeenCalledTimes(1);
  });

  it('impide desactivar al último administrador activo', async () => {
    const { service, tx } = serviceWith([OTHER_ADMIN_ID]);

    await expect(
      service.updateUser(OTHER_ADMIN_ID, { active: false }, ADMIN_ID),
    ).rejects.toThrow(BadRequestException);
    expect(tx.app_user.update).not.toHaveBeenCalled();
  });

  it('no consulta el invariante si el cambio no quita privilegios', async () => {
    const { service, tx } = serviceWith([ADMIN_ID]);

    await service.updateUser(ADMIN_ID, { username: 'nuevo' }, ADMIN_ID);

    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.app_user.update).toHaveBeenCalledTimes(1);
  });

  it('mantiene la regla de no desactivar la propia cuenta', async () => {
    const { service, prisma } = serviceWith([ADMIN_ID, OTHER_ADMIN_ID]);

    await expect(
      service.updateUser(ADMIN_ID, { active: false }, ADMIN_ID),
    ).rejects.toThrow('No puedes desactivar tu propia cuenta');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('impide eliminar al último administrador activo', async () => {
    const { service, tx } = serviceWith([OTHER_ADMIN_ID]);

    await expect(
      service.deleteUser(OTHER_ADMIN_ID, ADMIN_ID),
    ).rejects.toThrow(
      'No se puede eliminar al último Administrator activo del sistema',
    );
    expect(tx.app_user.delete).not.toHaveBeenCalled();
  });

  it('elimina a un usuario normal', async () => {
    const { service, tx } = serviceWith([ADMIN_ID]);

    await service.deleteUser(USER_ID, ADMIN_ID);

    expect(tx.app_user.delete).toHaveBeenCalledWith({
      where: { user_id: USER_ID },
    });
  });

  it('impide eliminar la propia cuenta', async () => {
    const { service, prisma } = serviceWith([ADMIN_ID, OTHER_ADMIN_ID]);

    await expect(service.deleteUser(ADMIN_ID, ADMIN_ID)).rejects.toThrow(
      'No puedes eliminar tu propia cuenta',
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('UsersService · unicidad', () => {
  it('traduce la violación de unicidad (P2002) en un 400 claro', async () => {
    const { service, prisma } = serviceWith([ADMIN_ID]);

    prisma.app_user.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.createUser({
        username: 'repetido',
        email: 'repetido@bns.cu',
        password: 'secreto123',
        role: 'User',
      }),
    ).rejects.toThrow(
      'El nombre de usuario o el email ya están registrados',
    );
  });
});
