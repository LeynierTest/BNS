import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { PrismaService } from '../../src/prisma/prisma.service';

export const FRONTEND_ORIGIN = 'http://localhost:5173';

export const ADMIN = {
  username: 'admin',
  password: 'Admin123!',
};

export const USER = {
  username: 'usuario',
  password: 'Usuario123!',
};

export type TestContext = {
  app: NestExpressApplication;
  prisma: PrismaService;
};

export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    logger: ['error', 'warn'],
  });

  configureApp(app);
  await app.init();

  return {
    app,
    prisma: app.get(PrismaService),
  };
}

/**
 * Deja la base de pruebas en un estado conocido: sin datos de dominio y
 * con un Administrator y un Usuario. Los roles los siembra la migración.
 */
export async function resetDatabase(
  prisma: PrismaService,
): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE TABLE
      match,
      player,
      coach,
      team_member,
      team,
      stadium,
      phase,
      app_user
    RESTART IDENTITY CASCADE
  `;

  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash(ADMIN.password, 4),
    bcrypt.hash(USER.password, 4),
  ]);

  await prisma.app_user.createMany({
    data: [
      {
        username: ADMIN.username,
        email: 'admin@bns.test',
        password_hash: adminHash,
        role_id: 1,
      },
      {
        username: USER.username,
        email: 'usuario@bns.test',
        password_hash: userHash,
        role_id: 2,
      },
    ],
  });
}

/**
 * Inicia sesión y devuelve un agente que conserva la cookie y envía el
 * Origin del frontend, como haría el navegador.
 */
export async function loginAs(
  app: NestExpressApplication,
  credentials: { username: string; password: string },
) {
  const agent = request.agent(app.getHttpServer());

  await agent.post('/auth/login').send(credentials).expect(201);
  agent.set('Origin', FRONTEND_ORIGIN);

  return agent;
}
