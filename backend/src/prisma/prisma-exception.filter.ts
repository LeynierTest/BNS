import { Catch, HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

type MappedError = {
  status: HttpStatus;
  message: string;
};

// Errores de PostgreSQL que indican un dato de entrada inválido en una
// consulta cruda (fecha o número mal formados, fecha fuera de rango).
const INVALID_INPUT_CODES = new Set(['22007', '22008', '22P02']);

function originalDatabaseError(
  error: Prisma.PrismaClientKnownRequestError,
): { code?: string; message?: string } {
  const cause = (
    error.meta?.driverAdapterError as
      | { cause?: { originalCode?: string; originalMessage?: string } }
      | undefined
  )?.cause;

  return {
    code: cause?.originalCode,
    message: cause?.originalMessage,
  };
}

/**
 * Traduce los errores conocidos de Prisma/PostgreSQL que ningún servicio
 * captura (condiciones de carrera, límites de tipo, reglas de los triggers)
 * a respuestas 4xx, para que la API nunca devuelva un 500 crudo por un
 * problema de datos. Los servicios siguen validando antes con mensajes
 * propios; esto es la última línea de defensa.
 */
export function mapPrismaError(
  error: Prisma.PrismaClientKnownRequestError,
): MappedError | null {
  switch (error.code) {
    case 'P2000':
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Un valor supera la longitud máxima permitida',
      };
    case 'P2002':
      return {
        status: HttpStatus.CONFLICT,
        message: 'Ya existe un registro con esos datos únicos',
      };
    case 'P2003':
      return {
        status: HttpStatus.CONFLICT,
        message:
          'La operación viola una relación entre registros: el registro referenciado no existe o tiene registros dependientes',
      };
    case 'P2020':
      return {
        status: HttpStatus.BAD_REQUEST,
        message: 'Un valor numérico está fuera del rango permitido',
      };
    case 'P2025':
      return {
        status: HttpStatus.NOT_FOUND,
        message: 'El registro solicitado no existe',
      };
    case 'P2010':
    case 'P2039': {
      const original = originalDatabaseError(error);

      // P0001: RAISE EXCEPTION de los triggers de reglas de negocio; su
      // mensaje está pensado para el usuario.
      if (original.code === 'P0001' && original.message) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: original.message,
        };
      }

      if (original.code === '23514') {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Los datos no cumplen una restricción de la base de datos',
        };
      }

      if (original.code && INVALID_INPUT_CODES.has(original.code)) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Un parámetro tiene un formato o valor inválido',
        };
      }

      return null;
    }
    default:
      return null;
  }
}

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const mapped = mapPrismaError(exception);

    if (!mapped || host.getType() !== 'http') {
      super.catch(exception, host);
      return;
    }

    const response = host.switchToHttp().getResponse<Response>();

    response.status(mapped.status).json({
      statusCode: mapped.status,
      message: mapped.message,
    });
  }
}
