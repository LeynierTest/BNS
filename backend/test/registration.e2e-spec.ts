import request from 'supertest';
import { USER, createTestApp, resetDatabase } from './utils/test-app';
import type { TestContext } from './utils/test-app';

const NEW_ACCOUNT = {
  username: 'Pedro.Perez',
  email: 'Pedro@BNS.test',
  password: 'pelota2026',
};

/** El límite de registros vive en memoria: una app nueva en cada prueba. */
let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestApp();
  await resetDatabase(ctx.prisma);
});

afterEach(async () => {
  await ctx.app.close();
});

function register(body: Record<string, unknown>) {
  return request(ctx.app.getHttpServer()).post('/auth/register').send(body);
}

describe('Registro de cuentas desde el login (e2e)', () => {
  it('crea una cuenta User, inicia su sesión y luego puede volver a entrar', async () => {
    const agent = request.agent(ctx.app.getHttpServer());

    const response = await agent
      .post('/auth/register')
      .send(NEW_ACCOUNT)
      .expect(201);

    expect(response.body.user).toMatchObject({
      username: 'Pedro.Perez',
      email: 'pedro@bns.test',
      role: 'User',
      role_id: 2,
      active: true,
    });
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(String(response.headers['set-cookie'])).toMatch(
      /access_token=.+HttpOnly/,
    );

    const me = await agent.get('/auth/me').expect(200);
    expect(me.body.user.username).toBe('Pedro.Perez');

    const stored = await ctx.prisma.app_user.findUniqueOrThrow({
      where: { username: 'Pedro.Perez' },
    });
    expect(stored.password_hash).not.toBe(NEW_ACCOUNT.password);

    await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send({ username: NEW_ACCOUNT.username, password: NEW_ACCOUNT.password })
      .expect(201);
  });

  it('la cuenta creada no tiene permisos de administrador', async () => {
    const agent = request.agent(ctx.app.getHttpServer());

    await agent.post('/auth/register').send(NEW_ACCOUNT).expect(201);

    await agent.get('/users').expect(403);
  });

  it('no deja elegir el rol (400) ni crea la cuenta', async () => {
    await register({ ...NEW_ACCOUNT, role: 'Administrator' }).expect(400);
    await register({ ...NEW_ACCOUNT, role_id: 1 }).expect(400);

    await expect(
      ctx.prisma.app_user.count({ where: { username: 'Pedro.Perez' } }),
    ).resolves.toBe(0);
  });

  it('rechaza un usuario o email ya registrados, sin distinguir mayúsculas (409)', async () => {
    const sameUsername = await register({
      ...NEW_ACCOUNT,
      username: USER.username.toUpperCase(),
    }).expect(409);
    expect(sameUsername.body.message).toBe(
      'Ese nombre de usuario ya está en uso',
    );

    const sameEmail = await register({
      ...NEW_ACCOUNT,
      email: 'USUARIO@bns.test',
    }).expect(409);
    expect(sameEmail.body.message).toBe('Ya existe una cuenta con ese email');
  });

  it('valida usuario, email y contraseña (400)', async () => {
    const cases: [Record<string, unknown>, string][] = [
      [
        { ...NEW_ACCOUNT, username: 'pe' },
        'El nombre de usuario debe tener entre 3 y 50 caracteres',
      ],
      [
        { ...NEW_ACCOUNT, username: 'Pedro Pérez' },
        'El nombre de usuario solo admite letras sin tilde, números, punto, guion y guion bajo',
      ],
      [{ ...NEW_ACCOUNT, email: 'pedro@' }, 'El email no es válido'],
      [
        { ...NEW_ACCOUNT, password: 'corta1' },
        'La contraseña debe tener entre 8 y 72 caracteres',
      ],
      [
        { ...NEW_ACCOUNT, password: 'sinnumeros' },
        'La contraseña debe tener al menos una letra y un número',
      ],
      [
        { ...NEW_ACCOUNT, password: '12345678' },
        'La contraseña debe tener al menos una letra y un número',
      ],
    ];

    for (const [body, message] of cases) {
      const response = await register(body).expect(400);
      expect(response.body.message).toContain(message);
    }

    await expect(ctx.prisma.app_user.count()).resolves.toBe(2);
  });

  it('dos registros simultáneos del mismo usuario: solo uno se crea', async () => {
    const results = await Promise.all([
      register(NEW_ACCOUNT),
      register({
        ...NEW_ACCOUNT,
        username: 'pedro.perez',
        email: 'otro@bns.test',
      }),
    ]);

    expect(
      results.map((result) => result.status).sort((a, b) => a - b),
    ).toEqual([201, 409]);
    await expect(ctx.prisma.app_user.count()).resolves.toBe(3);
  });

  it('tras 10 intentos en una hora bloquea los registros desde ese origen (429)', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await register({ ...NEW_ACCOUNT, username: USER.username }).expect(409);
    }

    const blocked = await register(NEW_ACCOUNT).expect(429);

    expect(blocked.body.message).toBe(
      'Demasiados intentos de registro desde este origen. Inténtalo de nuevo en 60 minutos',
    );
    // El login no comparte ese límite.
    await request(ctx.app.getHttpServer())
      .post('/auth/login')
      .send(USER)
      .expect(201);
  });
});
