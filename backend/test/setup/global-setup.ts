import { execFileSync } from 'node:child_process';

/**
 * Prepara la base de datos de pruebas e2e: valida que TEST_DATABASE_URL
 * apunte a una base dedicada y aplica todas las migraciones desde cero
 * (si una migración no corre limpia, la suite entera falla aquí).
 */
export default function globalSetup(): void {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error(
      'Define TEST_DATABASE_URL con una base de datos dedicada a pruebas e2e ' +
        '(p. ej. postgresql://usuario@localhost/bns_test). Las pruebas borran sus datos.',
    );
  }

  const databaseName = decodeURIComponent(
    new URL(url).pathname.replace(/^\//, ''),
  );

  if (!/(test|e2e)/i.test(databaseName)) {
    throw new Error(
      `TEST_DATABASE_URL apunta a "${databaseName}". Por seguridad, el nombre ` +
        'de la base de pruebas debe contener "test" o "e2e".',
    );
  }

  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: url,
    },
  });
}
