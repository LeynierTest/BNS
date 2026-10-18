import { ReportsService } from './reports.service';

describe('ReportsService · fechas en los PDF', () => {
  const previousTimeZone = process.env.TZ;

  beforeAll(() => {
    // Zona del equipo de desarrollo (UTC-4/-5): con ella, formatear una
    // columna DATE en hora local mostraba el día anterior.
    process.env.TZ = 'America/Havana';
  });

  afterAll(() => {
    process.env.TZ = previousTimeZone;
  });

  function formatDate(value: Date | string): string {
    const unused = {} as never;
    const service = new ReportsService(
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
      unused,
    );

    return service['formatDate'](value);
  }

  it('muestra el mismo día para una columna DATE (medianoche UTC)', () => {
    expect(formatDate(new Date('2026-10-17T00:00:00.000Z'))).toBe(
      '17/10/2026',
    );
  });

  it('muestra el mismo día para el parámetro YYYY-MM-DD del título', () => {
    expect(formatDate('2026-10-17')).toBe('17/10/2026');
  });

  it('devuelve el valor original si no es una fecha', () => {
    expect(formatDate('no-es-fecha')).toBe('no-es-fecha');
  });
});
