import request from 'supertest';
import { MailService } from '../src/mail/mail.service';
import {
  ADMIN,
  USER,
  createTestApp,
  loginAs,
  resetDatabase,
} from './utils/test-app';
import type { TestContext } from './utils/test-app';

/**
 * Los límites viven en memoria del proceso: cada prueba usa una app nueva
 * para empezar con los contadores a cero.
 */
let ctx: TestContext;

beforeEach(async () => {
  ctx = await createTestApp();
  await resetDatabase(ctx.prisma);
});

afterEach(async () => {
  await ctx.app.close();
});

function login(username: string, password: string) {
  return request(ctx.app.getHttpServer())
    .post('/auth/login')
    .send({ username, password });
}

describe('Inicio de sesión: bloqueo por intentos fallidos (e2e)', () => {
  it('tras 5 fallos bloquea esa cuenta desde ese origen, incluso con la contraseña correcta', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await login(USER.username, 'incorrecta').expect(401);
    }

    const blocked = await login(USER.username, USER.password).expect(429);

    expect(blocked.body.message).toBe(
      'Demasiados intentos fallidos de inicio de sesión. Inténtalo de nuevo en 15 minutos',
    );
    // Las demás cuentas siguen entrando.
    await login(ADMIN.username, ADMIN.password).expect(201);
  });

  it('un acierto antes del límite reinicia los fallos de esa cuenta', async () => {
    for (let attempt = 0; attempt < 4; attempt++) {
      await login(USER.username, 'incorrecta').expect(401);
    }

    await login(USER.username, USER.password).expect(201);

    for (let attempt = 0; attempt < 4; attempt++) {
      await login(USER.username, 'incorrecta').expect(401);
    }

    await login(USER.username, USER.password).expect(201);
  });

  it('30 fallos desde un mismo origen bloquean cualquier cuenta (probar muchos usuarios)', async () => {
    for (let attempt = 0; attempt < 30; attempt++) {
      await login(`inexistente${attempt}`, 'incorrecta').expect(401);
    }

    await login(ADMIN.username, ADMIN.password).expect(429);
  });
});

describe('Reportes por correo (e2e)', () => {
  let sendMail: jest.SpyInstance;

  beforeEach(() => {
    const mail = ctx.app.get(MailService);

    // Sin SMTP real en las pruebas: se comprueba qué se enviaría.
    sendMail = jest
      .spyOn(mail['transporter'], 'sendMail')
      .mockResolvedValue({ messageId: 'prueba' } as never);
  });

  function sendReport(
    agent: Awaited<ReturnType<typeof loginAs>>,
    recipient?: string,
  ) {
    return agent
      .post('/reports/email')
      .send({ report: 'standings', ...(recipient && { recipient }) });
  }

  it('un Usuario no puede enviar reportes a otra dirección (403)', async () => {
    const user = await loginAs(ctx.app, USER);
    const response = await sendReport(user, 'otra@persona.test').expect(403);

    expect(response.body.message).toBe(
      'Solo puedes enviar reportes a tu propio correo (usuario@bns.test)',
    );
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('un Usuario puede enviárselos a sí mismo, y es el destino por defecto', async () => {
    const user = await loginAs(ctx.app, USER);

    await sendReport(user, 'USUARIO@bns.test').expect(201);
    const byDefault = await sendReport(user).expect(201);

    expect(byDefault.body.recipient).toBe('usuario@bns.test');
    expect(sendMail).toHaveBeenLastCalledWith(
      expect.objectContaining({ to: 'usuario@bns.test' }),
    );
  });

  it('un Administrator puede enviarlos a cualquier dirección', async () => {
    const admin = await loginAs(ctx.app, ADMIN);

    await sendReport(admin, 'comision@inder.test').expect(201);

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'comision@inder.test' }),
    );
  });

  it('limita a 5 correos cada 10 minutos por usuario (429)', async () => {
    const user = await loginAs(ctx.app, USER);

    for (let attempt = 0; attempt < 5; attempt++) {
      await sendReport(user).expect(201);
    }

    const limited = await sendReport(user).expect(429);

    expect(limited.body.message).toBe(
      'Has pedido demasiados reportes por correo. Inténtalo de nuevo en 10 minutos',
    );
    expect(sendMail).toHaveBeenCalledTimes(5);

    // Otro usuario no comparte el límite.
    await sendReport(await loginAs(ctx.app, ADMIN)).expect(201);
  });
});
