import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import type {
  ArgumentMetadata,
  PipeTransform,
} from '@nestjs/common';
import { isDateOnly } from '../validators/is-date-only.decorator';

type ParseDateOnlyPipeOptions = {
  optional?: boolean;
};

/**
 * Valida parámetros de ruta o de query que representan una fecha
 * (YYYY-MM-DD) antes de que lleguen a una consulta SQL, para responder
 * 400 en lugar de dejar que PostgreSQL falle con un 500.
 */
@Injectable()
export class ParseDateOnlyPipe
  implements PipeTransform<unknown, string | undefined>
{
  constructor(
    private readonly options: ParseDateOnlyPipeOptions = {},
  ) {}

  transform(
    value: unknown,
    metadata: ArgumentMetadata,
  ): string | undefined {
    if (
      this.options.optional &&
      (value === undefined || value === '')
    ) {
      return undefined;
    }

    if (!isDateOnly(value)) {
      throw new BadRequestException(
        `El parámetro ${metadata.data ?? 'fecha'} debe ser una fecha válida con formato YYYY-MM-DD`,
      );
    }

    return value;
  }
}
