import {
  Injectable,
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

/** Fallos de inicio de sesión tolerados en cada ventana de 15 minutos. */
const FAILED_LOGINS_PER_ACCOUNT = 5;
const FAILED_LOGINS_PER_IP = 30;
const FAILED_LOGIN_WINDOW_MS = 15 * 60_000;

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
