import { HttpStatus } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PrismaExceptionFilter,
  mapPrismaError,
} from './prisma-exception.filter';

// Forma real de los errores de Prisma 7 + adapter-pg, observada contra
// PostgreSQL 16 (meta.driverAdapterError.cause).
function prismaError(
  code: string,
  original?: { originalCode: string; originalMessage: string },
) {
  return new Prisma.PrismaClientKnownRequestError('error de prueba', {
    code,
    clientVersion: 'test',
    meta: original
      ? { driverAdapterError: { cause: original } }
      : undefined,
  });
}

describe('mapPrismaError', () => {
  it.each([
    ['P2000', HttpStatus.BAD_REQUEST],
    ['P2002', HttpStatus.CONFLICT],
    ['P2003', HttpStatus.CONFLICT],
    ['P2020', HttpStatus.BAD_REQUEST],
    ['P2025', HttpStatus.NOT_FOUND],
  ])('traduce %s a HTTP %i', (code, status) => {
    expect(mapPrismaError(prismaError(code))?.status).toBe(status);
  });

  it('expone el mensaje de los triggers de reglas de negocio (P0001)', () => {
    expect(
      mapPrismaError(
        prismaError('P2039', {
          originalCode: 'P0001',
          originalMessage:
            'Attendance (5000) cannot exceed stadium capacity (1000)',
        }),
      ),
    ).toEqual({
      status: HttpStatus.BAD_REQUEST,
      message: 'Attendance (5000) cannot exceed stadium capacity (1000)',
    });
  });

  it('no expone el detalle de un CHECK (23514)', () => {
    expect(
      mapPrismaError(
        prismaError('P2039', {
          originalCode: '23514',
          originalMessage:
            'new row for relation "match" violates check constraint "match_teams_different_ck"',
        }),
      ),
    ).toEqual({
      status: HttpStatus.BAD_REQUEST,
      message: 'Los datos no cumplen una restricción de la base de datos',
    });
  });

  it('trata como 400 una entrada mal formada en una consulta cruda', () => {
    expect(
      mapPrismaError(
        prismaError('P2010', {
          originalCode: '22007',
          originalMessage: 'invalid input syntax for type date',
        }),
      )?.status,
    ).toBe(HttpStatus.BAD_REQUEST);
  });

  it('deja sin traducir los errores que no son de datos', () => {
    expect(mapPrismaError(prismaError('P1001'))).toBeNull();
    expect(
      mapPrismaError(
        prismaError('P2010', {
          originalCode: '42883',
          originalMessage: 'function does not exist',
        }),
      ),
    ).toBeNull();
  });
});

describe('PrismaExceptionFilter', () => {
  it('responde con el estado y el mensaje traducidos', () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({
        getResponse: () => ({ status }),
      }),
    } as unknown as ArgumentsHost;

    new PrismaExceptionFilter().catch(prismaError('P2025'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith({
      statusCode: HttpStatus.NOT_FOUND,
      message: 'El registro solicitado no existe',
    });
  });
});
