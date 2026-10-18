import {
  createBatter,
  createCoach,
  createMatch,
  createPhase,
  createStadium,
  createTeam,
} from './utils/fixtures';
import {
  ADMIN,
  createTestApp,
  loginAs,
  resetDatabase,
} from './utils/test-app';
import type { TestContext } from './utils/test-app';

describe('Reglas de negocio (e2e)', () => {
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
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    admin = await loginAs(ctx.app, ADMIN);

    const [away, home, stadium, phase] = await Promise.all([
      createTeam(admin, { name: 'Visitante' }),
      createTeam(admin, { name: 'Local' }),
      createStadium(admin, 'Estadio', 1000),
      createPhase(admin, 'Primera Ronda', '2026-10-01', '2026-10-31'),
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
      match_date: '2026-10-15',
      stadium_id: ref.stadiumId,
      phase_id: ref.phaseId,
      away_score: 1,
      home_score: 2,
      attendance: 500,
      ...overrides,
    };
  }

  describe('fecha del partido dentro del rango de su fase', () => {
    it.each(['2026-10-01', '2026-10-31'])(
      'acepta las fechas límite (%s)',
      async (matchDate) => {
        await admin
          .post('/matches')
          .send(matchPayload({ match_date: matchDate }))
          .expect(201);
      },
    );

    it.each(['2026-09-30', '2026-11-01'])(
      'rechaza %s con un mensaje claro',
      async (matchDate) => {
        const response = await admin
          .post('/matches')
          .send(matchPayload({ match_date: matchDate }))
          .expect(400);

        expect(response.body.message).toContain(
          'está fuera del período de la fase "Primera Ronda"',
        );
      },
    );

    it('al editar un partido también valida la nueva fecha', async () => {
      const match = await createMatch(admin, matchPayload());

      await admin
        .patch(`/matches/${match.match_id}`)
        .send({ match_date: '2026-12-01' })
        .expect(400);
    });

    it('no permite acortar una fase dejando partidos fuera del rango', async () => {
      await createMatch(admin, matchPayload({ match_date: '2026-10-20' }));

      const response = await admin
        .patch(`/phases/${ref.phaseId}`)
        .send({ end_date: '2026-10-15' })
        .expect(400);

      expect(response.body.message).toContain('fuera del nuevo intervalo');
    });
  });

  describe('integridad de los partidos', () => {
    it('rechaza que un equipo juegue contra sí mismo', async () => {
      await admin
        .post('/matches')
        .send(matchPayload({ home_team_id: ref.awayTeamId }))
        .expect(400);
    });

    it('rechaza una audiencia mayor que la capacidad del estadio (antes: 500)', async () => {
      const response = await admin
        .post('/matches')
        .send(matchPayload({ attendance: 1001 }))
        .expect(400);

      expect(response.body.message).toBe(
        'La audiencia (1001) no puede superar la capacidad del estadio "Estadio" (1000)',
      );
    });

    it('no permite reducir la capacidad por debajo de la mayor audiencia registrada', async () => {
      await createMatch(admin, matchPayload({ attendance: 800 }));

      await admin
        .patch(`/stadiums/${ref.stadiumId}`)
        .send({ capacity: 799 })
        .expect(400);
    });

    it('responde 404 al referenciar una fase inexistente', async () => {
      await admin
        .post('/matches')
        .send(matchPayload({ phase_id: 9999 }))
        .expect(404);
    });
  });

  describe('peloteros: entrenador o jugador, nunca ambos', () => {
    it('la base de datos impide registrar como entrenador a un jugador', async () => {
      const player = await createBatter(
        admin,
        ref.awayTeamId,
        'Jugador',
        10,
        'Receptor',
        0.3,
      );

      await expect(
        ctx.prisma.$executeRaw`
          INSERT INTO coach (team_member_id, years_experience)
          VALUES (${player.team_member_id}, 5)
        `,
      ).rejects.toThrow(
        'A team member cannot be both a coach and a player',
      );
    });

    it('la base de datos impide registrar como jugador a un entrenador', async () => {
      const coach = await createCoach(
        admin,
        ref.awayTeamId,
        'Entrenador',
        1,
        10,
      );

      await expect(
        ctx.prisma.$executeRaw`
          INSERT INTO player (team_member_id, position, at_bats, hits, batting_average)
          VALUES (${coach.team_member_id}, 'Receptor', 10, 3, 0.3)
        `,
      ).rejects.toThrow(
        'A team member cannot be both a player and a coach',
      );
    });

    it('el número de camiseta es único dentro de un equipo', async () => {
      await createCoach(admin, ref.awayTeamId, 'Entrenador', 7, 10);

      await admin
        .post('/players')
        .send({
          name: 'Jugador',
          number: 7,
          years_on_team: 1,
          team_id: ref.awayTeamId,
          position: 'Receptor',
          at_bats: 10,
          hits: 3,
          batting_average: 0.3,
        })
        .expect(400);
    });
  });

  describe('borrados que dejarían datos huérfanos', () => {
    it('no elimina un equipo con peloteros', async () => {
      await createCoach(admin, ref.awayTeamId, 'Entrenador', 1, 10);

      await admin.delete(`/teams/${ref.awayTeamId}`).expect(400);
    });

    it('no elimina una fase con partidos', async () => {
      await createMatch(admin, matchPayload());

      await admin.delete(`/phases/${ref.phaseId}`).expect(400);
    });

    it('no elimina un estadio con partidos', async () => {
      await createMatch(admin, matchPayload());

      await admin.delete(`/stadiums/${ref.stadiumId}`).expect(400);
    });
  });

  describe('usuarios', () => {
    it('rechaza un username repetido con 400 (no un 500 de PostgreSQL)', async () => {
      const response = await admin
        .post('/users')
        .send({
          username: ADMIN.username,
          email: 'otro@bns.test',
          password: 'secreto123',
          role: 'User',
        })
        .expect(400);

      expect(response.body.message).toBe(
        'El nombre de usuario o el email ya están registrados',
      );
    });

    it('rechaza un email repetido con 400', async () => {
      await admin
        .post('/users')
        .send({
          username: 'otro',
          email: 'admin@bns.test',
          password: 'secreto123',
          role: 'User',
        })
        .expect(400);
    });

    it('el último Administrator activo no puede quitarse el rol', async () => {
      const me = await admin.get('/auth/me').expect(200);

      await admin
        .patch(`/users/${me.body.user.user_id}`)
        .send({ role: 'User' })
        .expect(400);
    });

    it('con otro Administrator activo sí puede cederlo', async () => {
      await admin
        .post('/users')
        .send({
          username: 'admin2',
          email: 'admin2@bns.test',
          password: 'secreto123',
          role: 'Administrator',
        })
        .expect(201);
      const me = await admin.get('/auth/me').expect(200);

      await admin
        .patch(`/users/${me.body.user.user_id}`)
        .send({ role: 'User' })
        .expect(200);
    });
  });
});
