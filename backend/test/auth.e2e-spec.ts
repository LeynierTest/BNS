import request from 'supertest';
import { validTeam } from './utils/fixtures';
import {
  ADMIN,
  FRONTEND_ORIGIN,
  USER,
  createTestApp,
  loginAs,
  resetDatabase,
} from './utils/test-app';
import type { TestContext } from './utils/test-app';

describe('Autenticación, roles y origen (e2e)', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  function server() {
    return request(ctx.app.getHttpServer());
  }

  it('exige sesión en los endpoints que no son @Public (401)', async () => {
    await server().get('/teams').expect(401);
    await server().get('/standings').expect(401);
    await server().get('/matches/events').expect(401);
  });

  it('rechaza credenciales incorrectas sin revelar cuál falló (401)', async () => {
    const wrongPassword = await server()
      .post('/auth/login')
      .send({ username: ADMIN.username, password: 'incorrecta' })
      .expect(401);
    const unknownUser = await server()
      .post('/auth/login')
      .send({ username: 'nadie', password: 'incorrecta' })
      .expect(401);

    expect(wrongPassword.body.message).toBe(unknownUser.body.message);
  });

  it('el login entrega el perfil y una cookie httpOnly', async () => {
    const response = await server()
      .post('/auth/login')
      .send(ADMIN)
      .expect(201);

    expect(response.body.user).toMatchObject({
      username: ADMIN.username,
      role: 'Administrator',
    });
    expect(response.body.user).not.toHaveProperty('password_hash');
    expect(String(response.headers['set-cookie'])).toMatch(
      /access_token=[^;]+;.*HttpOnly/i,
    );
  });

  it('un Usuario puede consultar pero no modificar (403)', async () => {
    const agent = await loginAs(ctx.app, USER);

    await agent.get('/teams').expect(200);
    await agent.post('/teams').send(validTeam).expect(403);
    await agent.get('/users').expect(403);
    expect(await ctx.prisma.team.count()).toBe(0);
  });

  it('un Administrator puede crear', async () => {
    const agent = await loginAs(ctx.app, ADMIN);

    await agent.post('/teams').send(validTeam).expect(201);
    expect(await ctx.prisma.team.count()).toBe(1);
  });

  it('un usuario desactivado pierde el acceso con su cookie vigente', async () => {
    const agent = await loginAs(ctx.app, USER);

    await ctx.prisma.app_user.update({
      where: { username: USER.username },
      data: { active: false },
    });

    await agent.get('/teams').expect(401);
  });

  describe('protección CSRF por origen', () => {
    it('rechaza una mutación con cookie desde otro puerto de localhost (403)', async () => {
      const agent = await loginAs(ctx.app, ADMIN);

      await agent
        .post('/teams')
        .set('Origin', 'http://localhost:8080')
        .send(validTeam)
        .expect(403);
      expect(await ctx.prisma.team.count()).toBe(0);
    });

    it('rechaza una mutación con cookie sin cabecera Origin ni Referer (403)', async () => {
      const login = await server()
        .post('/auth/login')
        .send(ADMIN)
        .expect(201);
      const cookie = String(login.headers['set-cookie']);

      await server()
        .post('/teams')
        .set('Cookie', cookie)
        .send(validTeam)
        .expect(403);
    });

    it('acepta la misma mutación desde el origen del frontend', async () => {
      const agent = await loginAs(ctx.app, ADMIN);

      await agent
        .post('/teams')
        .set('Origin', FRONTEND_ORIGIN)
        .send(validTeam)
        .expect(201);
    });

    it('no afecta a clientes con Authorization: Bearer (sin cookie)', async () => {
      const login = await server()
        .post('/auth/login')
        .send(ADMIN)
        .expect(201);
      const token = /access_token=([^;]+)/.exec(
        String(login.headers['set-cookie']),
      )?.[1];

      expect(token).toBeDefined();

      await server()
        .post('/teams')
        .set('Authorization', `Bearer ${token}`)
        .send(validTeam)
        .expect(201);
    });
  });
});
