import { validate } from 'class-validator';
import { IsDateOnly, isDateOnly } from './is-date-only.decorator';

class DateHolder {
  @IsDateOnly()
  date: unknown;
}

async function errorsFor(value: unknown) {
  const holder = new DateHolder();
  holder.date = value;

  return validate(holder);
}

describe('isDateOnly', () => {
  it.each(['2026-10-17', '2024-02-29', '1999-12-31'])(
    'acepta la fecha de calendario %s',
    (value) => {
      expect(isDateOnly(value)).toBe(true);
    },
  );

  it.each([
    ['fecha imposible (V8 la desbordaría a marzo)', '2026-02-30'],
    ['29 de febrero en año no bisiesto', '2026-02-29'],
    ['mes 13', '2026-13-01'],
    ['fecha con hora', '2026-10-17T10:00:00Z'],
    ['sin ceros a la izquierda', '2026-1-7'],
    ['con espacios', ' 2026-10-17'],
    ['cadena vacía', ''],
  ])('rechaza %s (%s)', (_label, value) => {
    expect(isDateOnly(value)).toBe(false);
  });

  it.each([20261017, null, undefined, new Date('2026-10-17')])(
    'rechaza valores que no son cadenas (%p)',
    (value) => {
      expect(isDateOnly(value)).toBe(false);
    },
  );
});

describe('@IsDateOnly', () => {
  it('no produce errores para una fecha válida', async () => {
    await expect(errorsFor('2026-10-17')).resolves.toHaveLength(0);
  });

  it('produce un error en español para una fecha inválida', async () => {
    const errors = await errorsFor('2026-02-30');

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toEqual({
      isDateOnly:
        'date debe ser una fecha válida con formato YYYY-MM-DD',
    });
  });
});
