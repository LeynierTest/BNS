import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const publicUserSelect = {
  user_id: true,
  username: true,
  email: true,
  active: true,
  role_id: true,
  photo_url: true,
  role: {
    select: {
      name: true,
    },
  },
} satisfies Prisma.app_userSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(
    username?: string,
    email?: string,
    role?: string,
    active?: boolean,
  ) {
    return this.prisma.$queryRaw`
      SELECT *
      FROM search_users(
        p_username => ${username ?? null},
        p_email => ${email ?? null},
        p_role => ${role ?? null},
        p_active => ${active ?? null}
      )
    `;
  }

  async getAllUsers() {
    return this.prisma.app_user.findMany({
      select: publicUserSelect,
      orderBy: {
        user_id: 'asc',
      },
    });
  }

  async getUserById(id: number) {
    const user = await this.prisma.app_user.findUnique({
      where: {
        user_id: id,
      },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException(
        `El usuario con ID ${id} no existe`,
      );
    }

    return user;
  }

  async createUser(data: CreateUserDto) {
    const role = await this.prisma.role.findUnique({
      where: {
        name: data.role,
      },
    });

    if (!role) {
      throw new BadRequestException(
        'El rol especificado no existe',
      );
    }

    const passwordHash = await bcrypt.hash(
      data.password,
      12,
    );

    try {
      return await this.prisma.app_user.create({
        data: {
          username: data.username,
          email: data.email,
          password_hash: passwordHash,
          role_id: role.role_id,
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'El nombre de usuario o el email ya están registrados',
        );
      }

      throw error;
    }
  }

  async deleteUser(
    id: number,
    requesterId: number,
  ) {
    const user = await this.prisma.app_user.findUnique({
      where: {
        user_id: id,
      },
      select: {
        user_id: true,
        username: true,
        email: true,
        active: true,
        role_id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        `El usuario con ID ${id} no existe`,
      );
    }

    if (id === requesterId) {
      throw new BadRequestException(
        'No puedes eliminar tu propia cuenta',
      );
    }

    if (user.role.name === 'Administrator') {
      const administratorCount =
        await this.prisma.app_user.count({
          where: {
            role: {
              name: 'Administrator',
            },
          },
        });

      if (administratorCount <= 1) {
        throw new BadRequestException(
          'No se puede eliminar al último Administrator del sistema',
        );
      }
    }

    await this.prisma.app_user.delete({
      where: {
        user_id: id,
      },
    });

    return user;
  }

  async updateUser(
    id: number,
    data: UpdateUserDto,
    requesterId: number,
  ) {
    await this.getUserById(id);

    if (
      id === requesterId &&
      data.active === false
    ) {
      throw new BadRequestException(
        'No puedes desactivar tu propia cuenta',
      );
    }

    let roleId: number | undefined;

    if (data.role !== undefined) {
      const role = await this.prisma.role.findUnique({
        where: {
          name: data.role,
        },
      });

      if (!role) {
        throw new BadRequestException(
          'El rol especificado no existe',
        );
      }

      roleId = role.role_id;
    }

    const passwordHash =
      data.password !== undefined
        ? await bcrypt.hash(data.password, 12)
        : undefined;

    try {
      return await this.prisma.app_user.update({
        where: {
          user_id: id,
        },
        data: {
          ...(data.username !== undefined && {
            username: data.username,
          }),
          ...(data.email !== undefined && {
            email: data.email,
          }),
          ...(passwordHash !== undefined && {
            password_hash: passwordHash,
          }),
          ...(roleId !== undefined && {
            role_id: roleId,
          }),
          ...(data.active !== undefined && {
            active: data.active,
          }),
        },
        select: publicUserSelect,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'El nombre de usuario o el email ya están registrados',
        );
      }

      throw error;
    }
  }
}
