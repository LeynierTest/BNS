import request from 'supertest';
import {
  createMatch,
  createPhase,
  createStadium,
  createTeam,
} from './utils/fixtures';
import {
  ADMIN,
  USER,
  createTestApp,
  loginAs,
  resetDatabase,
} from './utils/test-app';
import type { TestContext } from './utils/test-app';

type Agent = Awaited<ReturnType<typeof loginAs>>;

interface TeamRef {
  team_id: number;
  team_name: string;
}

interface PhaseQualification {
  name: string;
  phase_id: number | null;
  active_teams: number | null;
  blocked: { reason: string; previous_phase: string } | null;
  participants: TeamRef[];
  standings: (TeamRef & { points: number; games_played: number })[];
  cut: {
    slots: number;
    status: string;
    qualified: TeamRef[];
    tie: {
      points: number;
      spots: number;
      contenders: TeamRef[];
      eliminated: TeamRef[];
      series: {
        team_a: TeamRef;
        team_b: TeamRef;
        wins_a: number;
        wins_b: number;
        winner_id: number | null;
      }[];
    } | null;
  } | null;
}

function names(refs: TeamRef[] | undefined) {
  return (refs ?? []).map((team) => team.team_name);
}

/**
 * Regla 8/4/2 con desempate en series de 3 partidos a ganar 2.
 *
 * 6 equipos: Primera Ronda no necesita partidos (6 <= 8 plazas, pasan
 * todos). Segunda Ronda (el ganador es el visitante, 3-1):
 *   Industriales     vence a Cienfuegos (02/02) y a Villa Clara (02/03) → 2
 *   Santiago de Cuba vence a Cienfuegos (02/04) y a Matanzas    (02/05) → 2
 *   Pinar del Río    vence a Cienfuegos (02/06) y a Villa Clara (02/07) → 2
 *   Matanzas         vence a Cienfuegos (02/08)                         → 1
 *   Villa Clara      vence a Cienfuegos (02/09)                         → 1
 *   Cienfuegos                                                          → 0
 * Al Play Off pasan 4: los tres de 2 puntos y uno de Matanzas / Villa
 * Clara, empatados a 1 punto por 1 plaza.
 *
 * Los `it` de este bloque son pasos de una misma historia y van en orden.
 */
describe('Regla 8/4/2: equipos activos por fase (e2e)', () => {
  let ctx: TestContext;
  let admin: Agent;
  let ids: {
    industriales: number;
    santiago: number;
    pinar: number;
    matanzas: number;
    villaClara: number;
    cienfuegos: number;
    stadium: number;
    primera: number;
    segunda: number;
    playOff: number;
  };
  let villaClaraBeatsCienfuegos: number;
  const tiebreakers: number[] = [];
  let playOffMatch: number;

  function matchPayload(
    phaseId: number,
    away: number,
    home: number,
    date: string,
    extra: Record<string, unknown> = {},
  ) {
    return {
      away_team_id: away,
      home_team_id: home,
      match_date: date,
      stadium_id: ids.stadium,
      phase_id: phaseId,
      away_score: 3,
      home_score: 1,
      attendance: 1000,
      ...extra,
    };
  }

  async function qualification() {
    const user = await loginAs(ctx.app, USER);
    const response = await user.get('/qualification').expect(200);

    return response.body as PhaseQualification[];
  }

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
    admin = await loginAs(ctx.app, ADMIN);

    const [industriales, santiago, pinar, matanzas, villaClara, cienfuegos] =
      await Promise.all(
        [
          'Industriales',
          'Santiago de Cuba',
          'Pinar del Río',
          'Matanzas',
          'Villa Clara',
          'Cienfuegos',
        ].map((name) => createTeam(admin, { name })),
      );
    const stadium = await createStadium(admin, 'Latinoamericano', 50000);
    const primera = await createPhase(admin, 'Primera Ronda', '2026-01-01', '2026-01-31');
    const segunda = await createPhase(admin, 'Segunda Ronda', '2026-02-01', '2026-02-28');
    const playOff = await createPhase(admin, 'Play Off', '2026-03-01', '2026-03-15');
    await createPhase(admin, 'Final', '2026-03-16', '2026-03-31');

    ids = {
      industriales: industriales.team_id,
      santiago: santiago.team_id,
      pinar: pinar.team_id,
      matanzas: matanzas.team_id,
      villaClara: villaClara.team_id,
      cienfuegos: cienfuegos.team_id,
      stadium: stadium.stadium_id,
      primera: primera.phase_id,
      segunda: segunda.phase_id,
      playOff: playOff.phase_id,
    };

    for (const [winner, loser, date] of [
      [ids.industriales, ids.cienfuegos, '2026-02-02'],
      [ids.industriales, ids.villaClara, '2026-02-03'],
      [ids.santiago, ids.cienfuegos, '2026-02-04'],
      [ids.santiago, ids.matanzas, '2026-02-05'],
      [ids.pinar, ids.cienfuegos, '2026-02-06'],
      [ids.pinar, ids.villaClara, '2026-02-07'],
      [ids.matanzas, ids.cienfuegos, '2026-02-08'],
    ] as const) {
      await createMatch(admin, matchPayload(ids.segunda, winner, loser, date));
    }

    villaClaraBeatsCienfuegos = (
      await createMatch(
        admin,
        matchPayload(ids.segunda, ids.villaClara, ids.cienfuegos, '2026-02-09'),
      )
    ).match_id;
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('GET /qualification exige sesión', async () => {
    await request(ctx.app.getHttpServer()).get('/qualification').expect(401);
  });

  it('muestra el empate en el corte de Segunda Ronda y bloquea el Play Off', async () => {
    const [primera, segunda, playOff, final] = await qualification();

    expect(primera).toMatchObject({
      name: 'Primera Ronda',
      active_teams: null,
      blocked: null,
      cut: { slots: 8, status: 'decided' },
    });
    expect(primera.participants).toHaveLength(6);

    expect(segunda.active_teams).toBe(8);
    expect(
      segunda.standings.map(({ team_name, points }) => [team_name, points]),
    ).toEqual([
      ['Industriales', 2],
      ['Pinar del Río', 2],
      ['Santiago de Cuba', 2],
      ['Matanzas', 1],
      ['Villa Clara', 1],
      ['Cienfuegos', 0],
    ]);
    expect(segunda.cut).toMatchObject({
      slots: 4,
      status: 'tied',
      tie: { points: 1, spots: 1, eliminated: [], series: [] },
    });
    expect(names(segunda.cut?.qualified)).toEqual([
      'Industriales',
      'Pinar del Río',
      'Santiago de Cuba',
    ]);
    expect(names(segunda.cut?.tie?.contenders)).toEqual([
      'Matanzas',
      'Villa Clara',
    ]);

    expect(playOff).toMatchObject({
      active_teams: 4,
      blocked: { reason: 'previous-cut-tied', previous_phase: 'Segunda Ronda' },
      participants: [],
    });
    expect(final.blocked).toEqual({
      reason: 'previous-phase-undecided',
      previous_phase: 'Play Off',
    });
  });

  it('no deja registrar partidos de Play Off mientras el corte está empatado', async () => {
    const before = await ctx.prisma.match.count();
    const response = await admin
      .post('/matches')
      .send(matchPayload(ids.playOff, ids.industriales, ids.santiago, '2026-03-02'))
      .expect(400);

    expect(response.body.message).toBe(
      'No se pueden registrar partidos de Play Off: el corte de Segunda Ronda ' +
        'está empatado entre Matanzas y Villa Clara (1 punto, 1 plaza) y se ' +
        'decide con series de desempate de 3 partidos a ganar 2',
    );
    expect(await ctx.prisma.match.count()).toBe(before);
  });

  it('el desempate solo lo juegan los empatados y no puede acabar igualado', async () => {
    const notTied = await admin
      .post('/matches')
      .send(
        matchPayload(ids.segunda, ids.industriales, ids.matanzas, '2026-02-20', {
          tiebreaker: true,
        }),
      )
      .expect(400);

    expect(notTied.body.message).toBe(
      'Solo pueden jugar el desempate de Segunda Ronda los equipos empatados ' +
        'en el corte que no hayan perdido una serie: Matanzas y Villa Clara',
    );

    const draw = await admin
      .post('/matches')
      .send(
        matchPayload(ids.segunda, ids.matanzas, ids.villaClara, '2026-02-20', {
          tiebreaker: true,
          away_score: 2,
          home_score: 2,
        }),
      )
      .expect(400);

    expect(draw.body.message).toBe(
      'Un partido de desempate no puede terminar empatado',
    );

    const noTie = await admin
      .post('/matches')
      .send(
        matchPayload(ids.primera, ids.matanzas, ids.villaClara, '2026-01-20', {
          tiebreaker: true,
        }),
      )
      .expect(400);

    expect(noTie.body.message).toBe(
      'No hay empate en el corte de Primera Ronda que desempatar',
    );

    await admin
      .post('/matches')
      .send(
        matchPayload(ids.segunda, ids.matanzas, ids.villaClara, '2026-02-20', {
          tiebreaker: 'si',
        }),
      )
      .expect(400);
  });

  it('una serie 2-1 decide el corte: Matanzas al Play Off y Villa Clara eliminado', async () => {
    for (const [winner, loser, date] of [
      [ids.matanzas, ids.villaClara, '2026-02-20'],
      [ids.villaClara, ids.matanzas, '2026-02-21'],
      [ids.matanzas, ids.villaClara, '2026-02-22'],
    ] as const) {
      const match = await createMatch(
        admin,
        matchPayload(ids.segunda, winner, loser, date, { tiebreaker: true }),
      );

      expect(match.tiebreaker).toBe(true);
      tiebreakers.push(match.match_id);
    }

    const [, segunda, playOff] = await qualification();

    expect(segunda.cut?.status).toBe('decided');
    expect(names(segunda.cut?.qualified)).toEqual([
      'Industriales',
      'Pinar del Río',
      'Santiago de Cuba',
      'Matanzas',
    ]);
    expect(names(segunda.cut?.tie?.eliminated)).toEqual(['Villa Clara']);
    expect(segunda.cut?.tie?.series).toEqual([
      expect.objectContaining({ winner_id: ids.matanzas }),
    ]);
    // Los desempates no cambian la tabla de la fase.
    expect(
      segunda.standings.find((team) => team.team_name === 'Matanzas'),
    ).toMatchObject({ points: 1, games_played: 2 });
    expect(playOff.blocked).toBeNull();
    expect(names(playOff.participants)).toEqual(names(segunda.cut?.qualified));

    const search = await admin
      .get('/matches/search?phase=Segunda')
      .expect(200);
    const flagged = (search.body as { match_id: number; tiebreaker: boolean }[])
      .filter((match) => match.tiebreaker)
      .map((match) => match.match_id);

    expect(flagged.sort((a, b) => a - b)).toEqual(tiebreakers);
  });

  it('un cuarto partido de desempate sobra', async () => {
    const response = await admin
      .post('/matches')
      .send(
        matchPayload(ids.segunda, ids.villaClara, ids.matanzas, '2026-02-23', {
          tiebreaker: true,
        }),
      )
      .expect(400);

    expect(response.body.message).toBe(
      'El desempate del corte de Segunda Ronda ya está resuelto',
    );
  });

  it('la tabla general (reporte 1) sí cuenta los desempates como victorias', async () => {
    const response = await admin.get('/standings').expect(200);
    const points = new Map(
      (response.body as { team_name: string; points: number }[]).map(
        (team) => [team.team_name, team.points],
      ),
    );

    expect(points.get('Matanzas')).toBe(3);
    expect(points.get('Villa Clara')).toBe(2);
  });

  it('un equipo eliminado no puede jugar el Play Off; los clasificados sí', async () => {
    const response = await admin
      .post('/matches')
      .send(matchPayload(ids.playOff, ids.villaClara, ids.industriales, '2026-03-02'))
      .expect(400);

    expect(response.body.message).toBe(
      'Villa Clara no está activo en Play Off: solo juegan los 4 equipos que clasificaron de Segunda Ronda',
    );

    playOffMatch = (
      await createMatch(
        admin,
        matchPayload(ids.playOff, ids.industriales, ids.matanzas, '2026-03-02'),
      )
    ).match_id;
  });

  it('no deja cambiar un resultado que reabriría un corte ya usado', async () => {
    const response = await admin
      .patch(`/matches/${villaClaraBeatsCienfuegos}`)
      .send({ away_score: 0, home_score: 5 })
      .expect(400);

    expect(response.body.message).toContain(
      'No se puede aplicar el cambio: dejaría inconsistente el partido del ' +
        '2026-02-20 entre Matanzas y Villa Clara (Segunda Ronda).',
    );

    const unchanged = await ctx.prisma.match.findUniqueOrThrow({
      where: { match_id: villaClaraBeatsCienfuegos },
    });

    expect([unchanged.away_score, unchanged.home_score]).toEqual([3, 1]);

    // Lo que la regla no mira (la audiencia) sí se puede corregir.
    await admin
      .patch(`/matches/${villaClaraBeatsCienfuegos}`)
      .send({ attendance: 1200 })
      .expect(200);
  });

  it('no deja borrar un desempate del que depende un partido del Play Off', async () => {
    const response = await admin
      .delete(`/matches/${tiebreakers[2]}`)
      .expect(400);

    expect(response.body.message).toContain(
      'dejaría inconsistente el partido del 2026-03-02 entre Industriales y Matanzas (Play Off)',
    );

    // Sin ese partido del Play Off, el desempate sí se puede borrar y el
    // corte vuelve a quedar empatado (serie 1-1).
    await admin.delete(`/matches/${playOffMatch}`).expect(200);
    await admin.delete(`/matches/${tiebreakers[2]}`).expect(200);

    const [, segunda, playOff] = await qualification();

    expect(segunda.cut?.status).toBe('tied');
    expect(segunda.cut?.tie?.series).toEqual([
      expect.objectContaining({ wins_a: 1, wins_b: 1, winner_id: null }),
    ]);
    expect(playOff.blocked?.reason).toBe('previous-cut-tied');
  });

  it('dos desempates simultáneos no pueden decidir la misma serie', async () => {
    // Con la serie 1-1, cada uno por separado la decidiría; el bloqueo de
    // escritura hace que el segundo se valide viendo al primero.
    const responses = await Promise.all([
      admin
        .post('/matches')
        .send(
          matchPayload(ids.segunda, ids.matanzas, ids.villaClara, '2026-02-22', {
            tiebreaker: true,
          }),
        ),
      admin
        .post('/matches')
        .send(
          matchPayload(ids.segunda, ids.villaClara, ids.matanzas, '2026-02-23', {
            tiebreaker: true,
          }),
        ),
    ]);

    expect(
      responses.map((response) => response.status).sort((a, b) => a - b),
    ).toEqual([201, 400]);

    const [, segunda] = await qualification();

    expect(segunda.cut?.status).toBe('decided');
    expect(
      await ctx.prisma.match.count({ where: { tiebreaker: true } }),
    ).toBe(3);
  });
});

describe('Fases de la Serie (e2e)', () => {
  let ctx: TestContext;
  let admin: Agent;
  let primeraId: number;

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);
    admin = await loginAs(ctx.app, ADMIN);

    const [teamA, teamB, stadium] = await Promise.all([
      createTeam(admin, { name: 'Equipo A' }),
      createTeam(admin, { name: 'Equipo B' }),
      createStadium(admin, 'Estadio', 50000),
    ]);
    const primera = await createPhase(admin, 'Primera Ronda', '2026-01-01', '2026-01-31');
    const segunda = await createPhase(admin, 'Segunda Ronda', '2026-02-01', '2026-02-28');

    primeraId = primera.phase_id;

    // Con 2 equipos pasan todos sin jugar Primera Ronda.
    await createMatch(admin, {
      away_team_id: teamA.team_id,
      home_team_id: teamB.team_id,
      match_date: '2026-02-05',
      stadium_id: stadium.stadium_id,
      phase_id: segunda.phase_id,
      away_score: 2,
      home_score: 1,
      attendance: 100,
    });
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  it('solo admite los nombres del enunciado', async () => {
    const response = await admin
      .post('/phases')
      .send({ name: 'Cuartos de final', start_date: '2026-03-01', end_date: '2026-03-10' })
      .expect(400);

    expect(response.body.message).toContain(
      'name debe ser una de: Primera Ronda, Segunda Ronda, Play Off, Final',
    );
  });

  it('cada fase existe una sola vez', async () => {
    const response = await admin
      .post('/phases')
      .send({ name: 'Segunda Ronda', start_date: '2026-03-01', end_date: '2026-03-10' })
      .expect(400);

    expect(response.body.message).toBe('Ya existe la fase Segunda Ronda');
  });

  it('una fase empieza después de que termine la anterior', async () => {
    const response = await admin
      .post('/phases')
      .send({ name: 'Play Off', start_date: '2026-02-28', end_date: '2026-03-10' })
      .expect(400);

    expect(response.body.message).toBe(
      'La fase Play Off debe comenzar después de que termine Segunda Ronda (2026-02-28)',
    );

    await admin
      .post('/phases')
      .send({ name: 'Play Off', start_date: '2026-03-01', end_date: '2026-03-10' })
      .expect(201);
  });

  it('una fase termina antes de que empiece la siguiente, también al renombrarla', async () => {
    const longer = await admin
      .patch(`/phases/${primeraId}`)
      .send({ end_date: '2026-02-01' })
      .expect(400);

    expect(longer.body.message).toBe(
      'La fase Primera Ronda debe terminar antes de que comience Segunda Ronda (2026-02-01)',
    );

    const renamed = await admin
      .patch(`/phases/${primeraId}`)
      .send({ name: 'Final' })
      .expect(400);

    expect(renamed.body.message).toBe(
      'La fase Final debe comenzar después de que termine Segunda Ronda (2026-02-28)',
    );
  });

  it('no deja borrar una fase vacía de la que dependen partidos posteriores', async () => {
    const response = await admin
      .delete(`/phases/${primeraId}`)
      .expect(400);

    expect(response.body.message).toBe(
      'No se puede aplicar el cambio: dejaría inconsistente el partido del ' +
        '2026-02-05 entre Equipo A y Equipo B (Segunda Ronda). No se pueden ' +
        'registrar partidos de Segunda Ronda: antes debe crearse la fase Primera Ronda',
    );
  });

  it('no deja añadir equipos a una temporada que ya empezó', async () => {
    const before = await ctx.prisma.team.count();
    const response = await admin
      .post('/teams')
      .send({
        name: 'Equipo nuevo',
        province: 'Holguín',
        championships_participated: 0,
        championships_won: 0,
        mascot: 'Cachorro',
        color: 'Rojo',
      })
      .expect(400);

    expect(response.body.message).toBe(
      'La temporada Temporada 1 de Serie Nacional de Béisbol ya empezó (tiene partidos registrados): no se permite añadir equipos',
    );
    expect(await ctx.prisma.team.count()).toBe(before);
  });
});
