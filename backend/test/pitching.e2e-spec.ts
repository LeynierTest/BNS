import { createPitcher, createTeam } from './utils/fixtures';
import type { PitchingLine } from './utils/fixtures';
import {
  ADMIN,
  createTestApp,
  loginAs,
  resetDatabase,
} from './utils/test-app';
import type { TestContext } from './utils/test-app';

type Agent = Awaited<ReturnType<typeof loginAs>>;

const line: PitchingLine = {
  innings_pitched: 30,
  runs_allowed: 10,
  hits_allowed: 30,
  walks_allowed: 10,
  strikeouts: 25,
  home_runs_allowed: 3,
  hit_batsmen: 1,
};

/**
 * Estadísticas de lanzador: validación de los datos y selección del
 * lanzador del equipo todos estrellas por menor ERA.
 */
describe('Estadísticas de lanzador (e2e)', () => {
  let ctx: TestContext;
  let admin: Agent;
  let teamId: number;
  let nextNumber = 1;

  function pitcherPayload(overrides: Record<string, unknown> = {}) {
    return {
      name: 'Lanzador',
      number: nextNumber++,
      years_on_team: 1,
      team_id: teamId,
      position: 'Lanzador',
      at_bats: null,
      hits: null,
      ...line,
      ...overrides,
    };
  }

  async function allStarPitcher() {
    const response = await admin.get('/players/all-star').expect(200);

    return (
      response.body as {
        player_position: string;
        player_name: string;
        pitching: Record<string, number | null> | null;
      }[]
    ).find((player) => player.player_position === 'Lanzador');
  }

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    admin = await loginAs(ctx.app, ADMIN);
    teamId = (await createTeam(admin)).team_id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  describe('validación', () => {
    it.each([
      [
        'entradas con décimas en vez de outs',
        { innings_pitched: 90.5 },
        'innings_pitched debe usar la notación de béisbol',
      ],
      [
        'un tercer out (.3 es otra entrada completa)',
        { innings_pitched: 90.3 },
        'innings_pitched debe usar la notación de béisbol',
      ],
      [
        'más jonrones que hits permitidos',
        { hits_allowed: 2, home_runs_allowed: 3 },
        'home_runs_allowed no puede ser mayor que hits_allowed',
      ],
      [
        'un promedio de bateo (el del lanzador es su ERA)',
        { batting_average: 0.2 },
        'property batting_average should not exist',
      ],
      [
        'sin ponches',
        { strikeouts: null },
        'Los lanzadores deben tener strikeouts',
      ],
      [
        'ponches negativos',
        { strikeouts: -1 },
        'strikeouts must not be less than 0',
      ],
    ])('rechaza un lanzador con %s', async (_label, overrides, message) => {
      const response = await admin
        .post('/players')
        .send(pitcherPayload(overrides))
        .expect(400);

      expect(String(response.body.message)).toContain(message);
      expect(await ctx.prisma.player.count()).toBe(0);
    });

    it('rechaza estadísticas de lanzador en un bateador', async () => {
      const response = await admin
        .post('/players')
        .send({
          name: 'Bateador',
          number: 99,
          years_on_team: 1,
          team_id: teamId,
          position: 'Receptor',
          at_bats: 10,
          hits: 3,
          walks_allowed: 2,
        })
        .expect(400);

      expect(response.body.message).toBe(
        'Los jugadores que no son lanzadores no pueden tener walks_allowed',
      );
    });

    it('la base de datos también exige los datos nuevos al lanzador', async () => {
      const member = await ctx.prisma.team_member.create({
        data: { name: 'Directo', number: 50, years_on_team: 1, team_id: teamId },
      });

      await expect(
        ctx.prisma.$executeRaw`
          INSERT INTO player (team_member_id, position, innings_pitched, runs_allowed)
          VALUES (${member.team_member_id}, 'Lanzador', 10, 2)
        `,
      ).rejects.toThrow('Los lanzadores deben tener entradas lanzadas');
    });

    it('guarda el promedio de bateo del lanzador como vacío', async () => {
      const response = await admin
        .post('/players')
        .send(pitcherPayload())
        .expect(201);

      expect(response.body.batting_average).toBeNull();
      expect(response.body).toMatchObject({
        hits_allowed: 30,
        walks_allowed: 10,
        strikeouts: 25,
        home_runs_allowed: 3,
        hit_batsmen: 1,
      });
    });
  });

  describe('selección del lanzador del equipo todos estrellas', () => {
    it('gana el menor ERA aunque tenga peor WHIP, K/9 o FIP', async () => {
      // A: ERA 9·10/30 = 3.00, pocos ponches.  B: ERA 9·12/30 = 3.60.
      await createPitcher(admin, teamId, 'A', 1, {
        ...line,
        hits_allowed: 45,
        strikeouts: 5,
      });
      await createPitcher(admin, teamId, 'B', 2, {
        ...line,
        runs_allowed: 12,
        hits_allowed: 15,
        strikeouts: 45,
      });

      expect(await allStarPitcher()).toMatchObject({
        player_name: 'A',
        pitching: { era: 3 },
      });
    });

    it('con el mismo ERA gana quien lanzó más entradas', async () => {
      // 9·10/30 = 9·20/60 = 3.00
      await createPitcher(admin, teamId, 'Menos entradas', 1, line);
      await createPitcher(admin, teamId, 'Más entradas', 2, {
        ...line,
        innings_pitched: 60,
        runs_allowed: 20,
      });

      expect(await allStarPitcher()).toMatchObject({
        player_name: 'Más entradas',
        pitching: { era: 3 },
      });
    });

    it('un lanzador sin entradas no tiene ERA y no compite', async () => {
      await createPitcher(admin, teamId, 'Sin entradas', 1, {
        ...line,
        innings_pitched: 0,
        runs_allowed: 0,
      });
      await createPitcher(admin, teamId, 'Titular', 2, line);

      expect(await allStarPitcher()).toMatchObject({
        player_name: 'Titular',
      });
    });

    it('un lanzador antiguo sin los datos nuevos compite por ERA y debe completarse al editarlo', async () => {
      const member = await ctx.prisma.team_member.create({
        data: { name: 'Antiguo', number: 40, years_on_team: 1, team_id: teamId },
      });

      // Simula una fila guardada antes de estas estadísticas, con el
      // promedio de bateo escrito a mano (los triggers actuales ya no lo
      // permitirían).
      await ctx.prisma.$transaction([
        ctx.prisma.$executeRaw`ALTER TABLE player DISABLE TRIGGER validate_player_stats_trigger`,
        ctx.prisma.$executeRaw`ALTER TABLE player DISABLE TRIGGER compute_batting_average_trigger`,
        ctx.prisma.$executeRaw`
          INSERT INTO player (team_member_id, position, innings_pitched, runs_allowed, batting_average)
          VALUES (${member.team_member_id}, 'Lanzador', 90.2, 25, 0.15)
        `,
        ctx.prisma.$executeRaw`ALTER TABLE player ENABLE TRIGGER compute_batting_average_trigger`,
        ctx.prisma.$executeRaw`ALTER TABLE player ENABLE TRIGGER validate_player_stats_trigger`,
      ]);
      await createPitcher(admin, teamId, 'Nuevo', 1, line);

      expect(await allStarPitcher()).toEqual({
        player_position: 'Lanzador',
        player_name: 'Antiguo',
        team_name: 'Industriales',
        batting_average: null,
        pitching: {
          era: 2.48,
          whip: null,
          k_per_9: null,
          bb_per_9: null,
          fip: null,
        },
      });

      const rename = await admin
        .patch(`/players/${member.team_member_id}`)
        .send({ name: 'Antiguo renombrado' })
        .expect(400);

      expect(rename.body.message).toBe(
        'Los lanzadores deben tener hits_allowed, walks_allowed, strikeouts, home_runs_allowed y hit_batsmen',
      );

      const completed = await admin
        .patch(`/players/${member.team_member_id}`)
        .send({
          hits_allowed: 80,
          walks_allowed: 20,
          strikeouts: 85,
          home_runs_allowed: 6,
          hit_batsmen: 3,
        })
        .expect(200);

      expect(completed.body.batting_average).toBeNull();
      expect((await allStarPitcher())?.pitching?.whip).toBe(1.1);
    });
  });
});
