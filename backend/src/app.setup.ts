import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { join } from 'node:path';
import { getAllowedOrigins } from './config/allowed-origins';

/**
 * Configuración global de la aplicación. Se comparte entre main.ts y las
 * pruebas e2e para que los tests ejerciten exactamente los mismos pipes,
 * cookies y CORS que producción.
 */
export function configureApp(app: NestExpressApplication): void {
  app.use(cookieParser());

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: getAllowedOrigins(),
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
