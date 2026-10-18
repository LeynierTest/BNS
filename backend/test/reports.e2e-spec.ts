import {
  createBatter,
  createCoach,
  createMatch,
  createPhase,
  createPitcher,
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

/**
 * Escenario calculado a mano contra el enunciado (README):
 *
 * Partidos (visitante @ local, marcador visitante-local):
 *   M1 Santiago @ Industriales 2-5, 800 personas, Latinoamericano, 1ª ronda, 10/10
 *   M2 Industriales @ Santiago 4-3, 400 personas, Moncada,         1ª ronda, 12/10
 *   M3 Pinar @ Industriales    6-1, 900 personas, Latinoamericano, 1ª ronda, 12/10
 *   M4 Matanzas @ Pinar        0-2, 300 personas, Moncada,         1ª ronda, 15/10
 *   M5 Santiago @ Industriales 7-6, 1000 personas, Latinoamericano, 2ª ronda, 05/11
 */
describe('Reportes del enunciado (e2e)', () => {
  let ctx: TestContext;
  let ids: {
    industriales: number;
    santiago: number;
    pinar: number;
    matanzas: number;
    latino: number;
    moncada: number;
    sanLuis: number;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
    await resetDatabase(ctx.prisma);

    const admin = await loginAs(ctx.app, ADMIN);

    const [industriales, santiago, pinar, matanzas] = await Promise.all([
      createTeam(admin, { name: 'Industriales', championships_won: 12 }),
      createTeam(admin, { name: 'Santiago de Cuba', championships_won: 7 }),
      createTeam(admin, { name: 'Pinar del Río', championships_won: 10 }),
      createTeam(admin, { name: 'Matanzas', championships_won: 1 }),
    ]);

    const [latino, moncada, sanLuis] = await Promise.all([
      createStadium(admin, 'Latinoamericano', 1000),
      createStadium(admin, 'Guillermón Moncada', 500),
      createStadium(admin, 'Capitán San Luis', 800),
    ]);

    const primera = await createPhase(
      admin,
      'Primera Ronda',
      '2026-10-01',
      '2026-10-31',
    );
    const segunda = await createPhase(
      admin,
      'Segunda Ronda',
      '2026-11-01',
      '2026-11-30',
    );

    ids = {
      industriales: industriales.team_id,
      santiago: santiago.team_id,
      pinar: pinar.team_id,
      matanzas: matanzas.team_id,
      latino: latino.stadium_id,
      moncada: moncada.stadium_id,
      sanLuis: sanLuis.stadium_id,
    };

    const matches = [
      [ids.santiago, ids.industriales, '2026-10-10', ids.latino, primera.phase_id, 2, 5, 800],
      [ids.industriales, ids.santiago, '2026-10-12', ids.moncada, primera.phase_id, 4, 3, 400],
      [ids.pinar, ids.industriales, '2026-10-12', ids.latino, primera.phase_id, 6, 1, 900],
      [ids.matanzas, ids.pinar, '2026-10-15', ids.moncada, primera.phase_id, 0, 2, 300],
      [ids.santiago, ids.industriales, '2026-11-05', ids.latino, segunda.phase_id, 7, 6, 1000],
    ] as const;

    for (const [away, home, date, stadium, phase, awayScore, homeScore, attendance] of matches) {
      await createMatch(admin, {
        away_team_id: away,
        home_team_id: home,
        match_date: date,
        stadium_id: stadium,
        phase_id: phase,
        away_score: awayScore,
        home_score: homeScore,
        attendance,
      });
    }

    for (const [team, name, number, experience] of [
      [ids.industriales, 'Coach I-20', 1, 20],
      [ids.industriales, 'Coach I-15', 2, 15],
      [ids.industriales, 'Coach I-10', 3, 10],
      [ids.industriales, 'Coach I-5', 4, 5],
      [ids.santiago, 'Coach S-8', 1, 8],
      [ids.pinar, 'Coach P-12', 1, 12],
      [ids.pinar, 'Coach P-3', 2, 3],
    ] as const) {
      await createCoach(admin, team, name, number, experience);
    }

    await createBatter(admin, ids.industriales, 'Jardinero I', 10, 'Jardinero', 0.32);
    await createBatter(admin, ids.santiago, 'Jardinero S', 10, 'Jardinero', 0.35);
    await createBatter(admin, ids.pinar, 'Receptor P', 10, 'Receptor', 0.28);
    await createPitcher(admin, ids.industriales, 'Lanzador I', 11, 0.15);
    await createPitcher(admin, ids.matanzas, 'Lanzador M', 10, 0.1);
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function get(path: string) {
    const agent = await loginAs(ctx.app, USER);
    const response = await agent.get(path).expect(200);

    return response.body as Record<string, unknown>[];
  }

  it('1. Tabla de posiciones: ordenada por puntos (1 por victoria)', async () => {
    const standings = await get('/standings');

    expect(
      standings.map(({ team_name, points, games_played }) => [
        team_name,
        points,
        games_played,
      ]),
    ).toEqual([
      ['Industriales', 2, 4],
      ['Pinar del Río', 2, 2],
      ['Santiago de Cuba', 1, 3],
      ['Matanzas', 0, 1],
    ]);
  });

  it('2. Partidos por equipos: los de ambos equipos, en cualquier orden', async () => {
    const forward = await get(
      `/matches/by-teams/${ids.industriales}/${ids.santiago}`,
    );
    const backward = await get(
      `/matches/by-teams/${ids.santiago}/${ids.industriales}`,
    );

    const summary = (rows: Record<string, unknown>[]) =>
      rows.map((row) => [
        String(row.match_date).slice(0, 10),
        row.away_team,
        row.home_team,
      ]);

    expect(summary(forward)).toEqual([
      ['2026-10-10', 'Santiago de Cuba', 'Industriales'],
      ['2026-10-12', 'Industriales', 'Santiago de Cuba'],
      ['2026-11-05', 'Santiago de Cuba', 'Industriales'],
    ]);
    expect(summary(backward)).toEqual(summary(forward));
  });

  it('3. Partidos por fecha: el estadio es opcional', async () => {
    const allThatDay = await get('/matches/by-date/2026-10-12');
    const atLatino = await get(
      `/matches/by-date/2026-10-12?stadiumId=${ids.latino}`,
    );
    const atSanLuis = await get(
      `/matches/by-date/2026-10-12?stadiumId=${ids.sanLuis}`,
    );

    expect(
      allThatDay
        .map((row) => String(row.stadium))
        .sort((a, b) => a.localeCompare(b)),
    ).toEqual([
      'Guillermón Moncada',
      'Latinoamericano',
    ]);
    expect(atLatino).toHaveLength(1);
    expect(atLatino[0]).toMatchObject({
      away_team: 'Pinar del Río',
      home_team: 'Industriales',
      stadium: 'Latinoamericano',
    });
    expect(atSanLuis).toEqual([]);
  });

  it('4. Entrenadores de más experiencia: 3 por equipo, por campeonatos ganados', async () => {
    const coaches = await get('/coaches/top');

    expect(
      coaches.map(({ team_name, coach_name, years_experience }) => [
        team_name,
        coach_name,
        years_experience,
      ]),
    ).toEqual([
      ['Industriales', 'Coach I-20', 20],
      ['Industriales', 'Coach I-15', 15],
      ['Industriales', 'Coach I-10', 10],
      ['Pinar del Río', 'Coach P-12', 12],
      ['Pinar del Río', 'Coach P-3', 3],
      ['Santiago de Cuba', 'Coach S-8', 8],
    ]);
    expect(coaches[0]).toHaveProperty('jersey_number', 1);
  });

  it('5. Estadios con mayor audiencia: total / (capacidad × partidos) × 100', async () => {
    const stadiums = await get('/stadiums/attendance');

    expect(
      stadiums.map(
        ({ stadium_name, games_played, total_attendance, attendance_percentage }) => [
          stadium_name,
          games_played,
          total_attendance,
          attendance_percentage,
        ],
      ),
    ).toEqual([
      ['Latinoamericano', 3, 2700, 90],
      ['Guillermón Moncada', 2, 700, 70],
      ['Capitán San Luis', 0, 0, null],
    ]);
  });

  it('6. Estado de un equipo: ganados/perdidos total, visitante y local, por fase', async () => {
    const status = await get(`/teams/${ids.industriales}/status`);

    expect(status).toEqual([
      {
        phase_name: 'Primera Ronda',
        games_won_total: 2,
        games_lost_total: 1,
        games_won_away: 1,
        games_lost_away: 0,
        games_won_home: 1,
        games_lost_home: 1,
      },
      {
        phase_name: 'Segunda Ronda',
        games_won_total: 0,
        games_lost_total: 1,
        games_won_away: 0,
        games_lost_away: 0,
        games_won_home: 0,
        games_lost_home: 1,
      },
    ]);
  });

  it('6b. Estado de un equipo inexistente responde 404', async () => {
    const agent = await loginAs(ctx.app, USER);

    await agent.get('/teams/9999/status').expect(404);
  });

  it('7. Equipo todos estrellas: un jugador por posición, el de mejor promedio', async () => {
    const allStars = await get('/players/all-star');

    expect(allStars).toEqual([
      {
        player_position: 'Jardinero',
        player_name: 'Jardinero S',
        team_name: 'Santiago de Cuba',
        batting_average: 0.35,
      },
      {
        player_position: 'Lanzador',
        player_name: 'Lanzador I',
        team_name: 'Industriales',
        batting_average: 0.15,
      },
      {
        player_position: 'Receptor',
        player_name: 'Receptor P',
        team_name: 'Pinar del Río',
        batting_average: 0.28,
      },
    ]);
  });

  it('los PDF de los reportes se generan', async () => {
    const agent = await loginAs(ctx.app, USER);

    const response = await agent
      .get('/reports/pdf/matches-by-date/2026-10-12')
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];

        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(response.headers['content-type']).toBe('application/pdf');
    expect((response.body as Buffer).subarray(0, 4).toString()).toBe(
      '%PDF',
    );
  });
});
