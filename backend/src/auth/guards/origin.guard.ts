import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type {
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { getAllowedOrigins } from '../../config/allowed-origins';
import { ACCESS_TOKEN_COOKIE } from '../auth.constants';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function originFromReferer(referer?: string): string | undefined {
  if (!referer) {
    return undefined;
  }

  try {
    return new URL(referer).origin;
  } catch {
    return undefined;
  }
}

/**
 * Protección CSRF para la sesión basada en cookie: una mutación que viaja
 * con la cookie de sesión debe proceder de un origen permitido. SameSite=lax
 * no basta, porque otro puerto de localhost es "same-site" y el navegador
 * adjunta la cookie a sus formularios POST.
 *
 * Las peticiones sin cookie (login, clientes con Authorization: Bearer) no
 * llevan credenciales implícitas que un tercero pueda aprovechar.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    if (SAFE_METHODS.has(request.method.toUpperCase())) {
      return true;
    }

    const sessionCookie: unknown =
      request.cookies?.[ACCESS_TOKEN_COOKIE];

    if (typeof sessionCookie !== 'string' || sessionCookie === '') {
      return true;
    }

    const origin =
      request.headers.origin ??
      originFromReferer(request.headers.referer);

    if (origin && getAllowedOrigins().includes(origin)) {
      return true;
    }

    throw new ForbiddenException(
      'El origen de la petición no está permitido',
    );
  }
}
