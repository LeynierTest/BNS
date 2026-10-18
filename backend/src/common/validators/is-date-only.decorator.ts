import { ValidateBy, buildMessage } from 'class-validator';
import type { ValidationOptions } from 'class-validator';

export const IS_DATE_ONLY = 'isDateOnly';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Comprueba que el valor sea una fecha de calendario real con formato
 * estricto YYYY-MM-DD (sin hora ni zona horaria). Rechaza fechas
 * imposibles como 2026-02-30, que `new Date()` desbordaría al mes
 * siguiente en vez de fallar.
 */
export function isDateOnly(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = DATE_ONLY_PATTERN.exec(value);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function IsDateOnly(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_DATE_ONLY,
      validator: {
        validate: (value): boolean => isDateOnly(value),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property debe ser una fecha válida con formato YYYY-MM-DD`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
