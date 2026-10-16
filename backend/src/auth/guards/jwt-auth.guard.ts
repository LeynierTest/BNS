import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import {
  IS_PUBLIC_KEY,
} from '../decorators/public.decorator';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';

export type JwtPayload = {
  sub: number;
  username: string;
  role_id: number;
  role: string;
};

export type AuthenticatedRequest = Request & {
  user?: JwtPayload;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(
        'Se requiere un token de autenticación',
      );
    }

    try {
      const payload =
        await this.jwtService.verifyAsync<JwtPayload>(token);

      const user = await this.prisma.app_user.findUnique({
        where: {
          user_id: payload.sub,
        },
        select: {
          user_id: true,
          username: true,
          active: true,
          role_id: true,
          role: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!user || !user.active) {
        throw new UnauthorizedException(
          'El usuario no existe o está desactivado',
        );
      }

      request.user = {
        sub: user.user_id,
        username: user.username,
        role_id: user.role_id,
        role: user.role.name,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException(
        'El token es inválido o ha expirado',
      );
    }
  }

  private extractToken(
    request: AuthenticatedRequest,
  ): string | null {
    const cookieToken =
      request.cookies?.[ACCESS_TOKEN_COOKIE];

    if (typeof cookieToken === 'string' && cookieToken) {
      return cookieToken;
    }

    const authorization = request.headers.authorization;

    if (
      authorization &&
      authorization.startsWith('Bearer ')
    ) {
      return authorization.substring(7);
    }

    return null;
  }
}
