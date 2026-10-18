import { ValidateBy, buildMessage } from 'class-validator';
import type { ValidationOptions } from 'class-validator';

export const IS_BASEBALL_INNINGS = 'isBaseballInnings';

/**
 * Entradas lanzadas en notación de béisbol: la parte decimal cuenta outs,
 * no décimas (90.2 = 90 entradas y 2 outs = 90 ⅔). Solo admite .0, .1 y
 * .2. Misma regla que el CHECK player_innings_pitched_notation_ck y que
 * la función SQL innings_to_decimal, que convierte a entradas reales.
 */
export function isBaseballInnings(value: unknown): value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return false;
  }

  const tenths = Math.round(value * 10);

  return Math.abs(value * 10 - tenths) < 1e-9 && tenths % 10 <= 2;
}

export function IsBaseballInnings(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return ValidateBy(
    {
      name: IS_BASEBALL_INNINGS,
      validator: {
        validate: (value): boolean => isBaseballInnings(value),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property debe usar la notación de béisbol: entradas completas y .0, .1 o .2 (outs), p. ej. 90.2 = 90 ⅔`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
