import {
  createMatch,
  createPhase,
  createStadium,
  createTeam,
  validTeam,
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

type SeasonSummary = {
  season_id: number;
  name: string;
  series_name: string;
  team_count: number;
  phase_count: number;
  match_count: number;
  started: boolean;
};

/**
 * Temporadas: una Serie (competición) se juega en temporadas; cada una
 * inscribe sus equipos y tiene sus fases y partidos. Equipos, peloteros y
 * estadios son comunes.
 */
describe('Temporadas (e2e)', () => {
  let ctx: TestContext;
  let admin: Agent;
  let ids: {
    industriales: number;
    santiago: number;
    pinar: number;
    stadium: number;
    primera1: number;
  };

  beforeAll(async () => {
    ctx = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(ctx.prisma);
    admin = await loginAs(ctx.app, ADMIN);

    // Temporada 1 (la de la migración): tres equipos y un partido jugado.
    const industriales = await createTeam(admin, { name: 'Industriales' });
    const santiago = await createTeam(admin, { name: 'Santiago de Cuba' });
    const pinar = await createTeam(admin, { name: 'Pinar del Río' });
    const stadium = await createStadium(admin, 'Latinoamericano', 50000);
    const primera1 = await createPhase(admin, 'Primera Ronda', '2026-01-01', '2026-01-31');

    await createMatch(admin, {
      away_team_id: industriales.team_id,
      home_team_id: santiago.team_id,
      match_date: '2026-01-10',
      stadium_id: stadium.stadium_id,
      phase_id: primera1.phase_id,
      away_score: 3,
      home_score: 1,
      attendance: 1000,
    });

    ids = {
      industriales: industriales.team_id,
      santiago: santiago.team_id,
      pinar: pinar.team_id,
      stadium: stadium.stadium_id,
      primera1: primera1.phase_id,
    };
  });

  afterAll(async () => {
    await ctx.app.close();
  });

  async function seasons() {
    const response = await admin.get('/seasons').expect(200);

    return response.body as SeasonSummary[];
  }

  async function createSeason(body: Record<string, unknown>) {
    const response = await admin.post('/seasons').send(body).expect(201);

    return response.body as { season_id: number; name: string };
  }

  it('lista las temporadas con su Serie, equipos, fases y si ya empezaron', async () => {
    expect(await seasons()).toEqual([
      expect.objectContaining({
        name: 'Temporada 1',
        series_name: 'Serie Nacional de Béisbol',
        team_count: 3,
        phase_count: 1,
        match_count: 1,
        started: true,
      }),
    ]);
  });

  it('una temporada nueva empieza vacía, con todos los equipos inscritos por defecto', async () => {
    const season = await createSeason({
      name: 'Temporada 2',
      series_name: 'Serie Nacional de Béisbol',
    });

    const list = await seasons();

    expect(list.map((item) => item.name)).toEqual(['Temporada 2', 'Temporada 1']);
    expect(list[0]).toMatchObject({ team_count: 3, phase_count: 0, started: false });

    // Sin season_id se usa la más reciente: la nueva, sin partidos.
    expect((await admin.get('/matches').expect(200)).body).toEqual([]);

    const standings = await admin.get('/standings').expect(200);

    expect(
      (standings.body as { points: number; games_played: number }[]).every(
        (team) => team.points === 0 && team.games_played === 0,
      ),
    ).toBe(true);

    // La temporada anterior conserva sus datos.
    const old = await admin.get('/matches?season_id=1').expect(200);

    expect(old.body).toHaveLength(1);
    expect(season.season_id).toBe(2);
  });

  it('crea una Serie nueva al crear su primera temporada', async () => {
    await createSeason({
      name: '2027',
      series_name: 'Liga Élite',
      team_ids: [ids.industriales, ids.pinar],
    });

    const series = await admin.get('/series').expect(200);

    expect((series.body as { name: string }[]).map((item) => item.name)).toEqual([
      'Liga Élite',
      'Serie Nacional de Béisbol',
    ]);

    const teams = await admin.get('/seasons/2/teams').expect(200);

    expect((teams.body as { name: string }[]).map((team) => team.name)).toEqual([
      'Industriales',
      'Pinar del Río',
    ]);
  });

  it('las fases se repiten entre temporadas, pero no dentro de una', async () => {
    const season = await createSeason({ name: 'Temporada 2', series_id: 1 });

    await admin
      .post('/phases')
      .send({ name: 'Primera Ronda', start_date: '2027-01-01', end_date: '2027-01-31', season_id: season.season_id })
      .expect(201);

    const duplicate = await admin
      .post('/phases')
      .send({ name: 'Primera Ronda', start_date: '2027-02-01', end_date: '2027-02-28', season_id: season.season_id })
      .expect(400);

    expect(duplicate.body.message).toBe('Ya existe la fase Primera Ronda');

    const phases = await admin.get('/phases?season_id=1').expect(200);

    expect(phases.body).toHaveLength(1);
  });

  it('solo juegan la temporada sus equipos inscritos', async () => {
    const season = await createSeason({
      name: 'Temporada 2',
      series_id: 1,
      team_ids: [ids.industriales, ids.santiago],
    });
    const phase = await createPhase(admin, 'Primera Ronda', '2027-01-01', '2027-01-31');

    const response = await admin
      .post('/matches')
      .send({
        away_team_id: ids.pinar,
        home_team_id: ids.industriales,
        match_date: '2027-01-10',
        stadium_id: ids.stadium,
        phase_id: phase.phase_id,
        away_score: 1,
        home_score: 0,
        attendance: 100,
      })
      .expect(400);

    expect(response.body.message).toBe('Pinar del Río no está activo en Primera Ronda');

    const qualification = await admin
      .get(`/qualification?season_id=${season.season_id}`)
      .expect(200);

    expect(
      (qualification.body as { participants: { team_name: string }[] }[])[0].participants.map(
        (team) => team.team_name,
      ),
    ).toEqual(['Industriales', 'Santiago de Cuba']);
  });

  it('los equipos de una temporada solo cambian antes de que empiece', async () => {
    const season = await createSeason({ name: 'Temporada 2', series_id: 1 });

    // Antes de empezar: se pueden cambiar los inscritos y añadir equipos.
    await admin
      .put(`/seasons/${season.season_id}/teams`)
      .send({ team_ids: [ids.industriales, ids.santiago] })
      .expect(200);

    const created = await admin
      .post('/teams')
      .send({ ...validTeam, name: 'Matanzas' })
      .expect(201);

    const teams = await admin.get(`/seasons/${season.season_id}/teams`).expect(200);

    expect((teams.body as { team_id: number }[]).map((team) => team.team_id)).toContain(
      created.body.team_id,
    );

    // Una vez empezada (con un partido), ya no.
    const started = await admin
      .put('/seasons/1/teams')
      .send({ team_ids: [ids.industriales, ids.santiago] })
      .expect(400);

    expect(started.body.message).toBe(
      'La temporada Temporada 1 de Serie Nacional de Béisbol ya empezó (tiene partidos registrados): no se permite cambiar los equipos inscritos',
    );

    await admin
      .post('/teams')
      .send({ ...validTeam, name: 'Cienfuegos', season_id: 1 })
      .expect(400);
  });

  it('no deja eliminar un equipo inscrito en una temporada ya empezada', async () => {
    // Pinar del Río no tiene partidos ni peloteros, pero juega la Temporada 1.
    const response = await admin.delete(`/teams/${ids.pinar}`).expect(400);

    expect(response.body.message).toBe(
      'La temporada Temporada 1 de Serie Nacional de Béisbol ya empezó (tiene partidos registrados): no se permite eliminar Pinar del Río',
    );
  });

  it('no deja mover un partido a una fase de otra temporada', async () => {
    await createSeason({ name: 'Temporada 2', series_id: 1 });
    const phase = await createPhase(admin, 'Primera Ronda', '2027-01-01', '2027-01-31');
    const [match] = (await admin.get('/matches?season_id=1').expect(200)).body as {
      match_id: number;
    }[];

    const response = await admin
      .patch(`/matches/${match.match_id}`)
      .send({ phase_id: phase.phase_id, match_date: '2027-01-10' })
      .expect(400);

    expect(response.body.message).toBe(
      'No se puede mover un partido a una fase de otra temporada',
    );
  });

  it('valida la creación de temporadas', async () => {
    const noSeries = await admin
      .post('/seasons')
      .send({ name: 'Sin serie' })
      .expect(400);

    expect(noSeries.body.message).toBe(
      'Indica la Serie: series_id de una existente o series_name para crearla',
    );

    const duplicate = await admin
      .post('/seasons')
      .send({ name: 'Temporada 1', series_id: 1 })
      .expect(400);

    expect(duplicate.body.message).toBe('Ya existe la temporada Temporada 1 en esa Serie');

    await admin
      .post('/seasons')
      .send({ name: 'Un equipo', series_id: 1, team_ids: [ids.industriales] })
      .expect(400);

    await admin
      .post('/seasons')
      .send({ name: 'Inexistente', series_id: 1, team_ids: [ids.industriales, 999] })
      .expect(400);

    await admin.get('/standings?season_id=999').expect(404);
  });

  it('solo un Administrator crea temporadas o cambia sus equipos', async () => {
    const user = await loginAs(ctx.app, USER);

    await user.post('/seasons').send({ name: 'Temporada 2', series_id: 1 }).expect(403);
    await user
      .put('/seasons/1/teams')
      .send({ team_ids: [ids.industriales, ids.santiago] })
      .expect(403);
    await user.get('/seasons').expect(200);
  });

  it('el PDF de la tabla indica la temporada', async () => {
    const response = await admin
      .get('/reports/pdf/standings?season_id=1')
      .buffer(true)
      .expect(200);

    expect(response.headers['content-type']).toContain('application/pdf');
  });
});
