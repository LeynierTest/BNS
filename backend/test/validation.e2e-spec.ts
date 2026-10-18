import {
  createPhase,
  createStadium,
  createTeam,
  validTeam,
} from './utils/fixtures';
import {
  ADMIN,
  createTestApp,
  loginAs,
  resetDatabase,
} from './utils/test-app';
import type { TestContext } from './utils/test-app';

/**
 * Entradas inválidas que antes llegaban a la base de datos (o a
 * `new Date()`) y terminaban en un 500 o en datos corruptos: ahora deben
 * responder 400 sin escribir nada.
 */
describe('Validación de entrada (e2e)', () => {
  let ctx: TestContext;
  let admin: Awaited<ReturnType<typeof loginAs>>;
  let ref: {
    awayTeamId: number;
    homeTeamId: number;
    stadiumId: number;
    phaseId: number;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
    admin = await loginAs(ctx.app, ADMIN);

    const [away, home, stadium, phase] = await Promise.all([
      createTeam(admin, { name: 'Visitante' }),
      createTeam(admin, { name: 'Local' }),
      createStadium(admin, 'Estadio', 1000),
      createPhase(admin, 'Primera Ronda', '2026-02-01', '2026-03-31'),
    ]);

    ref = {
      awayTeamId: away.team_id,
      homeTeamId: home.team_id,
      stadiumId: stadium.stadium_id,
      phaseId: phase.phase_id,
    };
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  function matchPayload(overrides: Record<string, unknown> = {}) {
    return {
      away_team_id: ref.awayTeamId,
      home_team_id: ref.homeTeamId,
      match_date: '2026-03-01',
      stadium_id: ref.stadiumId,
      phase_id: ref.phaseId,
      away_score: 1,
      home_score: 2,
      attendance: 500,
      ...overrides,
    };
  }

  describe('cuerpos (DTO)', () => {
    it.each([
      ['fecha imposible (antes se guardaba como 2026-03-02)', '2026-02-30'],
      ['fecha con hora (antes provocaba RangeError → 500)', '2026-03-01T10:00:00Z'],
      ['formato local', '01/03/2026'],
    ])('partido con %s → 400', async (_label, matchDate) => {
      const response = await admin
        .post('/matches')
        .send(matchPayload({ match_date: matchDate }))
        .expect(400);

      expect(response.body.message).toContain(
        'match_date debe ser una fecha válida con formato YYYY-MM-DD',
      );
      expect(await ctx.prisma.match.count()).toBe(0);
    });

    it('fase con fecha y hora → 400', async () => {
      await admin
        .post('/phases')
        .send({
          name: 'Play Off',
          start_date: '2026-04-01T00:00:00Z',
          end_date: '2026-04-30',
        })
        .expect(400);
    });

    it('equipo con un nombre más largo que la columna (VARCHAR 100) → 400', async () => {
      await admin
        .post('/teams')
        .send({ ...validTeam, name: 'x'.repeat(101) })
        .expect(400);
    });

    it('jugador con una posición fuera de la lista → 400', async () => {
      const response = await admin
        .post('/players')
        .send({
          name: 'Jugador',
          number: 30,
          years_on_team: 1,
          team_id: ref.awayTeamId,
          position: 'Pitcher',
          at_bats: 10,
          hits: 3,
        })
        .expect(400);

      expect(String(response.body.message)).toContain(
        'position debe ser una de: Receptor',
      );
    });

    function batterPayload(overrides: Record<string, unknown> = {}) {
      return {
        name: 'Jugador',
        number: 31,
        years_on_team: 1,
        team_id: ref.awayTeamId,
        position: 'Receptor',
        at_bats: 7,
        hits: 2,
        ...overrides,
      };
    }

    it('jugador que envía su promedio de bateo (se calcula) → 400', async () => {
      const response = await admin
        .post('/players')
        .send(batterPayload({ batting_average: 0.5 }))
        .expect(400);

      expect(response.body.message).toContain(
        'property batting_average should not exist',
      );
    });

    it('jugador con más hits que veces al bate → 400', async () => {
      const response = await admin
        .post('/players')
        .send(batterPayload({ at_bats: 3, hits: 4 }))
        .expect(400);

      expect(response.body.message).toBe(
        'hits no puede ser mayor que at_bats',
      );
    });

    it('el promedio de bateo es hits / veces al bate (redondeado a 3 decimales)', async () => {
      const created = await admin
        .post('/players')
        .send(batterPayload({ number: 32 }))
        .expect(201);
      // 2 / 7 = 0.2857…
      expect(Number(created.body.batting_average)).toBe(0.286);

      const updated = await admin
        .patch(`/players/${created.body.team_member_id}`)
        .send({ hits: 7 })
        .expect(200);

      expect(Number(updated.body.batting_average)).toBe(1);
    });

    it('usuario con contraseña de menos de 6 caracteres → 400', async () => {
      await admin
        .post('/users')
        .send({
          username: 'corta',
          email: 'corta@bns.test',
          password: '123',
          role: 'User',
        })
        .expect(400);
    });

    it('un entero fuera del rango de INTEGER llega a la base y responde 400 (filtro de Prisma)', async () => {
      const response = await admin
        .post('/teams')
        .send({
          ...validTeam,
          championships_participated: 3_000_000_000,
          championships_won: 0,
        })
        .expect(400);

      expect(response.body.message).toBe(
        'Un valor numérico está fuera del rango permitido',
      );
    });

    it('rechaza propiedades no declaradas en el DTO → 400', async () => {
      await admin
        .post('/teams')
        .send({ ...validTeam, team_id: 999 })
        .expect(400);
    });
  });

  describe('parámetros de ruta y de búsqueda', () => {
    it.each([
      '/matches/search?match_date=no-es-fecha',
      '/phases/search?active_date=2026-02-30',
      '/teams/search?championships_won=abc',
      '/players/search?number=1.5',
      '/coaches/search?years_experience=diez',
      '/stadiums/search?capacity=mucha',
      '/users/search?active=quizas',
      '/matches/by-date/2026-13-01',
      '/matches/by-date/2026-10-12?stadiumId=abc',
      '/reports/pdf/matches-by-date/hoy',
      '/reports/pdf/matches-by-date/2026-10-12?stadiumId=abc',
    ])('GET %s → 400', async (path) => {
      await admin.get(path).expect(400);
    });

    it.each([
      '/matches/search?match_date=2026-03-01',
      '/phases/search?active_date=2026-03-01',
      '/teams/search?championships_won=12',
      '/players/search?number=10',
      '/coaches/search?years_experience=10',
      '/stadiums/search?capacity=1000',
      '/users/search?active=true',
    ])('GET %s con valores válidos → 200', async (path) => {
      await admin.get(path).expect(200);
    });

    it('active=false filtra solo usuarios inactivos (antes cualquier texto valía como false)', async () => {
      const inactive = await admin
        .get('/users/search?active=false')
        .expect(200);
      const active = await admin
        .get('/users/search?active=true')
        .expect(200);

      expect(inactive.body).toEqual([]);
      expect(active.body).toHaveLength(2);
    });
  });
});
