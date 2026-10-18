import { BadRequestException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import { ParseDateOnlyPipe } from './parse-date-only.pipe';

const metadata: ArgumentMetadata = {
  type: 'query',
  data: 'match_date',
};

describe('ParseDateOnlyPipe', () => {
  it('devuelve la fecha cuando es válida', () => {
    expect(
      new ParseDateOnlyPipe().transform('2026-10-17', metadata),
    ).toBe('2026-10-17');
  });

  it('lanza BadRequestException con una fecha inválida', () => {
    const pipe = new ParseDateOnlyPipe();

    expect(() => pipe.transform('2026-02-30', metadata)).toThrow(
      BadRequestException,
    );
    expect(() => pipe.transform('17/10/2026', metadata)).toThrow(
      'El parámetro match_date debe ser una fecha válida con formato YYYY-MM-DD',
    );
  });

  it('es obligatoria por defecto', () => {
    expect(() =>
      new ParseDateOnlyPipe().transform(undefined, metadata),
    ).toThrow(BadRequestException);
  });

  it('con optional acepta ausencia o cadena vacía', () => {
    const pipe = new ParseDateOnlyPipe({ optional: true });

    expect(pipe.transform(undefined, metadata)).toBeUndefined();
    expect(pipe.transform('', metadata)).toBeUndefined();
    expect(() => pipe.transform('mañana', metadata)).toThrow(
      BadRequestException,
    );
  });
});
