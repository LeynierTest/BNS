import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import {
  FixedWindowLimiter,
  tooManyRequests,
} from '../common/rate-limit/fixed-window-limiter';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

/** Fallos de inicio de sesión tolerados en cada ventana de 15 minutos. */
const FAILED_LOGINS_PER_ACCOUNT = 5;
const FAILED_LOGINS_PER_IP = 30;
const FAILED_LOGIN_WINDOW_MS = 15 * 60_000;

/** Intentos de registro admitidos por origen en cada ventana de una hora. */
const REGISTRATIONS_PER_IP = 10;
const REGISTRATION_WINDOW_MS = 60 * 60_000;

/** Rol de toda cuenta creada desde el login. */
const SELF_REGISTERED_ROLE = 'User';

/**
 * Clave de `pg_advisory_xact_lock` que serializa los registros: la unicidad
 * sin distinguir mayúsculas se comprueba antes de insertar, y dos registros
 * simultáneos de "Pedro" y "pedro" no deben pasar los dos.
 */
const REGISTRATION_LOCK = 843;

/** Mismo coste que las cuentas creadas por un administrador. */
const PASSWORD_HASH_ROUNDS = 12;

export type AuthUserProfile = {
  user_id: number;
  username: string;
  email: string;
  active: boolean;
  role_id: number;
  role: string;
  photo_url: string | null;
};

type UserWithRole = {
  user_id: number;
  username: string;
  email: string;
  active: boolean;
  role_id: number;
  photo_url: string | null;
  role: {
    name: string;
  };
};

@Injectable()
export class AuthService {
  // Contra la fuerza bruta: fallos por usuario y origen (adivinar una
  // contraseña) y por origen (probar muchos usuarios). Mientras dura el
  // bloqueo se rechaza incluso la contraseña correcta.
  private readonly failedLoginsByAccount = new FixedWindowLimiter(
    FAILED_LOGINS_PER_ACCOUNT,
    FAILED_LOGIN_WINDOW_MS,
  );

  private readonly failedLoginsByIp = new FixedWindowLimiter(
    FAILED_LOGINS_PER_IP,
    FAILED_LOGIN_WINDOW_MS,
  );

  // Contra la creación masiva de cuentas (y el sondeo de qué usuarios o
  // emails existen): cuenta cada intento, salga bien o mal.
  private readonly registrationsByIp = new FixedWindowLimiter(
    REGISTRATIONS_PER_IP,
    REGISTRATION_WINDOW_MS,
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly storage: StorageService,
  ) {}

  private toProfile(user: UserWithRole): AuthUserProfile {
    return {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      active: user.active,
      role_id: user.role_id,
      role: user.role.name,
      photo_url: user.photo_url,
    };
  }

  async login(data: LoginDto, ip = 'desconocida') {
    const accountKey = `${data.username.toLowerCase()}|${ip}`;
    const blockedFor = Math.max(
      this.failedLoginsByAccount.blockedFor(accountKey),
      this.failedLoginsByIp.blockedFor(ip),
    );

    if (blockedFor > 0) {
      throw tooManyRequests(
        'Demasiados intentos fallidos de inicio de sesión',
        blockedFor,
      );
    }

    const rejectCredentials = () => {
      this.failedLoginsByAccount.hit(accountKey);
      this.failedLoginsByIp.hit(ip);

      return new UnauthorizedException(
        'Usuario o contraseña incorrectos',
      );
    };

    const user = await this.prisma.app_user.findUnique({
      where: {
        username: data.username,
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.active) {
      throw rejectCredentials();
    }

    const passwordValid = await bcrypt.compare(
      data.password,
      user.password_hash,
    );

    if (!passwordValid) {
      throw rejectCredentials();
    }

    this.failedLoginsByAccount.reset(accountKey);

    return this.startSession(user);
  }

  /**
   * Crea una cuenta con el rol User y deja la sesión iniciada, como el
   * login. El nombre de usuario y el email no se pueden repetir, sin
   * distinguir mayúsculas; el email se guarda en minúsculas.
   */
  async register(data: RegisterDto, ip = 'desconocida') {
    const blockedFor = this.registrationsByIp.blockedFor(ip);

    if (blockedFor > 0) {
      throw tooManyRequests(
        'Demasiados intentos de registro desde este origen',
        blockedFor,
      );
    }

    this.registrationsByIp.hit(ip);

    const username = data.username;
    const email = data.email.toLowerCase();
    // Fuera de la transacción: el hash es lento y no debe alargar el bloqueo.
    const passwordHash = await bcrypt.hash(
      data.password,
      PASSWORD_HASH_ROUNDS,
    );

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${REGISTRATION_LOCK}::bigint)`;

      const [sameUsername, sameEmail, role] = await Promise.all([
        tx.app_user.findFirst({
          where: {
            username: { equals: username, mode: 'insensitive' },
          },
          select: { user_id: true },
        }),
        tx.app_user.findFirst({
          where: {
            email: { equals: email, mode: 'insensitive' },
          },
          select: { user_id: true },
        }),
        tx.role.findUnique({
          where: { name: SELF_REGISTERED_ROLE },
        }),
      ]);

      if (sameUsername) {
        throw new ConflictException(
          'Ese nombre de usuario ya está en uso',
        );
      }

      if (sameEmail) {
        throw new ConflictException(
          'Ya existe una cuenta con ese email',
        );
      }

      if (!role) {
        // Lo siembra la migración inicial: sin él la base está incompleta.
        throw new InternalServerErrorException(
          `No existe el rol ${SELF_REGISTERED_ROLE}`,
        );
      }

      return tx.app_user.create({
        data: {
          username,
          email,
          password_hash: passwordHash,
          role_id: role.role_id,
        },
        include: {
          role: true,
        },
      });
    });

    return this.startSession(user);
  }

  private async startSession(user: UserWithRole) {
    const payload = {
      sub: user.user_id,
      username: user.username,
      role_id: user.role_id,
      role: user.role.name,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: this.toProfile(user),
    };
  }

  async getProfile(
    userId: number,
  ): Promise<AuthUserProfile> {
    const user = await this.prisma.app_user.findUnique({
      where: {
        user_id: userId,
      },
      include: {
        role: true,
      },
    });

    if (!user || !user.active) {
      throw new UnauthorizedException(
        'El usuario no existe o está desactivado',
      );
    }

    return this.toProfile(user);
  }

  async updatePhoto(
    userId: number,
    buffer: Buffer,
  ): Promise<AuthUserProfile> {
    const current = await this.prisma.app_user.findUnique({
      where: {
        user_id: userId,
      },
      select: {
        photo_url: true,
      },
    });

    if (!current) {
      throw new UnauthorizedException(
        'El usuario no existe o está desactivado',
      );
    }

    const photoUrl =
      await this.storage.saveAvatar(userId, buffer);

    const updated = await this.prisma.app_user.update({
      where: {
        user_id: userId,
      },
      data: {
        photo_url: photoUrl,
      },
      include: {
        role: true,
      },
    });

    await this.storage.removeAvatar(current.photo_url);

    return this.toProfile(updated);
  }

  async removePhoto(
    userId: number,
  ): Promise<AuthUserProfile> {
    const current = await this.prisma.app_user.findUnique({
      where: {
        user_id: userId,
      },
      select: {
        photo_url: true,
      },
    });

    if (!current) {
      throw new UnauthorizedException(
        'El usuario no existe o está desactivado',
      );
    }

    const updated = await this.prisma.app_user.update({
      where: {
        user_id: userId,
      },
      data: {
        photo_url: null,
      },
      include: {
        role: true,
      },
    });

    await this.storage.removeAvatar(current.photo_url);

    return this.toProfile(updated);
  }
}
