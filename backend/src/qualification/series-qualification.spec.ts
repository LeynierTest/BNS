import {
  UNSAVED_ID,
  computeSeriesQualification,
  describeViolation,
  findIntroducedViolation,
} from './series-qualification';
import type {
  SeriesMatch,
  SeriesSnapshot,
} from './series-qualification';

const PRIMERA = 1;
const SEGUNDA = 2;
const PLAY_OFF = 3;
const FINAL = 4;

const ALL_PHASES = [
  { phase_id: PRIMERA, name: 'Primera Ronda' },
  { phase_id: SEGUNDA, name: 'Segunda Ronda' },
  { phase_id: PLAY_OFF, name: 'Play Off' },
  { phase_id: FINAL, name: 'Final' },
];

/** Equipos 1..n llamados «Equipo 01», «Equipo 02»… (el orden alfabético es el de su id). */
function teams(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    team_id: index + 1,
    name: `Equipo ${String(index + 1).padStart(2, '0')}`,
  }));
}

function name(teamId: number) {
  return `Equipo ${String(teamId).padStart(2, '0')}`;
}

let nextMatchId = 1;

function game(
  phaseId: number,
  awayTeamId: number,
  homeTeamId: number,
  awayScore: number,
  homeScore: number,
  { tiebreaker = false, date = '2026-01-10' } = {},
): SeriesMatch {
  return {
    match_id: nextMatchId++,
    phase_id: phaseId,
    away_team_id: awayTeamId,
    home_team_id: homeTeamId,
    away_score: awayScore,
    home_score: homeScore,
    tiebreaker,
    match_date: date,
  };
}

/** `times` victorias de `winner` sobre `loser` (1 punto cada una para `winner`). */
function wins(
  phaseId: number,
  winner: number,
  loser: number,
  times = 1,
): SeriesMatch[] {
  return Array.from({ length: times }, () =>
    game(phaseId, winner, loser, 3, 1),
  );
}

function tiebreak(
  phaseId: number,
  winner: number,
  loser: number,
  date: string,
): SeriesMatch {
  return game(phaseId, winner, loser, 4, 2, { tiebreaker: true, date });
}

function ids(refs: { team_id: number }[]) {
  return refs.map((team) => team.team_id);
}

/**
 * 10 equipos en Primera Ronda: 1..7 con 2 puntos, 8 y 9 con 1 y 10 con 0.
 * Para 8 plazas, los equipos 8 y 9 empatan en el corte por 1 plaza.
 */
function tiedPrimeraRonda(): SeriesSnapshot {
  return {
    teams: teams(10),
    phases: ALL_PHASES,
    matches: [
      ...[1, 2, 3, 4, 5, 6, 7].flatMap((team) => wins(PRIMERA, team, 10, 2)),
      ...wins(PRIMERA, 8, 10),
      ...wins(PRIMERA, 9, 10),
    ],
  };
}

describe('computeSeriesQualification (regla 8/4/2)', () => {
  beforeEach(() => {
    nextMatchId = 1;
  });

  it('Primera Ronda la juegan todos y con un corte limpio pasan los 8 primeros', () => {
    const result = computeSeriesQualification({
      teams: teams(10),
      phases: ALL_PHASES,
      matches: [1, 2, 3, 4, 5, 6, 7, 8].flatMap((team) =>
        wins(PRIMERA, team, 10),
      ),
    });
    const [primera, segunda, playOff, final] = result.phases;

    expect(ids(primera.participants)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(primera.active_teams).toBeNull();
    expect(primera.cut).toMatchObject({ slots: 8, status: 'decided', tie: null });
    expect(ids(primera.cut?.qualified ?? [])).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);

    expect(segunda.blocked).toBeNull();
    expect(segunda.active_teams).toBe(8);
    expect(ids(segunda.participants)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // Segunda Ronda aún no tiene partidos: no se sabe quién pasa al Play Off.
    expect(segunda.cut).toMatchObject({ slots: 4, status: 'undecided' });
    expect(playOff.blocked).toEqual({
      reason: 'previous-phase-undecided',
      previous_phase: 'Segunda Ronda',
    });
    expect(final.blocked?.reason).toBe('previous-phase-undecided');
    expect(final.cut).toBeNull();
    expect(result.violations).toEqual([]);
  });

  it('la tabla de la fase da 1 punto por victoria y ordena por puntos y nombre', () => {
    const { phases } = computeSeriesQualification({
      teams: teams(3),
      phases: ALL_PHASES,
      matches: [
        ...wins(PRIMERA, 3, 1, 2),
        game(PRIMERA, 2, 1, 5, 5),
      ],
    });

    expect(phases[0].standings).toEqual([
      { team_id: 3, team_name: name(3), games_played: 2, points: 2 },
      { team_id: 1, team_name: name(1), games_played: 3, points: 0 },
      { team_id: 2, team_name: name(2), games_played: 1, points: 0 },
    ]);
  });

  it('con menos equipos que plazas clasifican todos aunque no se haya jugado', () => {
    const { phases, violations } = computeSeriesQualification({
      teams: teams(4),
      phases: ALL_PHASES.slice(0, 2),
      matches: [],
    });
    const [primera, segunda, playOff, final] = phases;

    expect(primera.cut?.status).toBe('decided');
    expect(ids(segunda.participants)).toEqual([1, 2, 3, 4]);
    expect(segunda.cut?.status).toBe('decided');
    // Play Off no existe todavía, pero ya se sabe quién lo jugaría.
    expect(playOff.phase_id).toBeNull();
    expect(playOff.blocked).toBeNull();
    expect(ids(playOff.participants)).toEqual([1, 2, 3, 4]);
    expect(playOff.cut).toBeNull();
    expect(final.blocked).toEqual({
      reason: 'missing-previous-phase',
      previous_phase: 'Play Off',
    });
    expect(violations).toEqual([]);
  });

  it('un empate en el corte bloquea la fase siguiente hasta desempatar', () => {
    const snapshot = tiedPrimeraRonda();
    const segundaMatch = game(SEGUNDA, 1, 2, 1, 0, { date: '2026-02-05' });
    const { phases, violations } = computeSeriesQualification({
      ...snapshot,
      matches: [...snapshot.matches, segundaMatch],
    });
    const [primera, segunda] = phases;

    expect(primera.cut?.status).toBe('tied');
    expect(ids(primera.cut?.qualified ?? [])).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(primera.cut?.tie).toMatchObject({ points: 1, spots: 1 });
    expect(ids(primera.cut?.tie?.contenders ?? [])).toEqual([8, 9]);
    expect(segunda.blocked?.reason).toBe('previous-cut-tied');
    expect(segunda.participants).toEqual([]);
    expect(violations).toEqual([
      {
        match_id: segundaMatch.match_id,
        match_label: `del 2026-02-05 entre ${name(1)} y ${name(2)} (Segunda Ronda)`,
        message:
          'No se pueden registrar partidos de Segunda Ronda: el corte de ' +
          `Primera Ronda está empatado entre ${name(8)} y ${name(9)} ` +
          '(1 punto, 1 plaza) y se decide con series de desempate de 3 ' +
          'partidos a ganar 2',
      },
    ]);
  });

  it('una serie de desempate 2-1 decide el corte y elimina al perdedor', () => {
    const snapshot = tiedPrimeraRonda();
    const { phases, violations } = computeSeriesQualification({
      ...snapshot,
      matches: [
        ...snapshot.matches,
        tiebreak(PRIMERA, 8, 9, '2026-01-29'),
        tiebreak(PRIMERA, 9, 8, '2026-01-30'),
        tiebreak(PRIMERA, 8, 9, '2026-01-31'),
      ],
    });
    const [primera, segunda] = phases;

    expect(primera.cut?.status).toBe('decided');
    expect(ids(primera.cut?.qualified ?? [])).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(primera.cut?.tie).toMatchObject({
      contenders: [{ team_id: 8, team_name: name(8) }],
      eliminated: [{ team_id: 9, team_name: name(9) }],
      series: [
        {
          team_a: { team_id: 8, team_name: name(8) },
          team_b: { team_id: 9, team_name: name(9) },
          wins_a: 2,
          wins_b: 1,
          winner_id: 8,
        },
      ],
    });
    // Los desempates no suman puntos en la tabla de la fase.
    expect(primera.standings.find((team) => team.team_id === 8)).toMatchObject({
      points: 1,
      games_played: 1,
    });
    expect(segunda.blocked).toBeNull();
    expect(ids(segunda.participants)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(violations).toEqual([]);
  });

  it('con 2-0 el desempate queda resuelto y un tercer partido sobra', () => {
    const snapshot = tiedPrimeraRonda();
    const extra = tiebreak(PRIMERA, 9, 8, '2026-01-31');
    const { phases, violations } = computeSeriesQualification({
      ...snapshot,
      matches: [
        ...snapshot.matches,
        tiebreak(PRIMERA, 9, 8, '2026-01-29'),
        tiebreak(PRIMERA, 9, 8, '2026-01-30'),
        extra,
      ],
    });

    expect(ids(phases[1].participants)).toContain(9);
    expect(ids(phases[1].participants)).not.toContain(8);
    expect(violations).toEqual([
      expect.objectContaining({
        match_id: extra.match_id,
        message: 'El desempate del corte de Primera Ronda ya está resuelto',
      }),
    ]);
  });

  it('solo desempatan los empatados y ningún desempate puede acabar igualado', () => {
    const snapshot = tiedPrimeraRonda();
    const outsider = tiebreak(PRIMERA, 1, 8, '2026-01-29');
    const draw = game(PRIMERA, 8, 9, 2, 2, {
      tiebreaker: true,
      date: '2026-01-30',
    });
    const { phases, violations } = computeSeriesQualification({
      ...snapshot,
      matches: [...snapshot.matches, outsider, draw],
    });

    expect(phases[0].cut?.status).toBe('tied');
    expect(violations.map(({ match_id, message }) => [match_id, message])).toEqual([
      [
        outsider.match_id,
        'Solo pueden jugar el desempate de Primera Ronda los equipos ' +
          `empatados en el corte que no hayan perdido una serie: ${name(8)} y ${name(9)}`,
      ],
      [draw.match_id, 'Un partido de desempate no puede terminar empatado'],
    ]);
  });

  it('con tres empatados por una plaza, quien pierde una serie queda fuera', () => {
    // 1..7 con 2 puntos; 8, 9 y 10 con 1; 11 con 0.
    const base: SeriesSnapshot = {
      teams: teams(11),
      phases: ALL_PHASES,
      matches: [
        ...[1, 2, 3, 4, 5, 6, 7].flatMap((team) => wins(PRIMERA, team, 11, 2)),
        ...[8, 9, 10].flatMap((team) => wins(PRIMERA, team, 11)),
      ],
    };
    const firstSeries = [
      tiebreak(PRIMERA, 8, 9, '2026-01-25'),
      tiebreak(PRIMERA, 8, 9, '2026-01-26'),
    ];

    const midway = computeSeriesQualification({
      ...base,
      matches: [...base.matches, ...firstSeries],
    });

    expect(midway.phases[0].cut?.status).toBe('tied');
    expect(ids(midway.phases[0].cut?.tie?.contenders ?? [])).toEqual([8, 10]);
    expect(ids(midway.phases[0].cut?.tie?.eliminated ?? [])).toEqual([9]);
    expect(midway.phases[1].blocked).toMatchObject({
      reason: 'previous-cut-tied',
    });

    const eliminatedPlaysAgain = tiebreak(PRIMERA, 9, 10, '2026-01-27');
    const final = computeSeriesQualification({
      ...base,
      matches: [
        ...base.matches,
        ...firstSeries,
        eliminatedPlaysAgain,
        tiebreak(PRIMERA, 10, 8, '2026-01-28'),
        tiebreak(PRIMERA, 10, 8, '2026-01-29'),
      ],
    });

    expect(final.phases[0].cut?.status).toBe('decided');
    expect(ids(final.phases[1].participants)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 10,
    ]);
    expect(ids(final.phases[0].cut?.tie?.eliminated ?? [])).toEqual([9, 8]);
    expect(final.violations).toEqual([
      expect.objectContaining({
        match_id: eliminatedPlaysAgain.match_id,
        message: expect.stringContaining(`hayan perdido una serie: ${name(8)} y ${name(10)}`),
      }),
    ]);
  });

  it('con tres empatados por dos plazas basta una serie', () => {
    // 1..6 con 2 puntos; 7, 8 y 9 con 1; 10 y 11 con 0.
    const { phases, violations } = computeSeriesQualification({
      teams: teams(11),
      phases: ALL_PHASES,
      matches: [
        ...[1, 2, 3, 4, 5, 6].flatMap((team) => wins(PRIMERA, team, 11, 2)),
        ...[7, 8, 9].flatMap((team) => wins(PRIMERA, team, 10)),
        tiebreak(PRIMERA, 7, 8, '2026-01-28'),
        tiebreak(PRIMERA, 7, 8, '2026-01-29'),
      ],
    });

    expect(phases[0].cut?.tie).toMatchObject({ points: 1, spots: 2 });
    expect(ids(phases[1].participants)).toEqual([1, 2, 3, 4, 5, 6, 7, 9]);
    expect(violations).toEqual([]);
  });

  it('un partido regular con un equipo eliminado es una violación y no puntúa', () => {
    const snapshot = tiedPrimeraRonda();
    const withEliminated = game(SEGUNDA, 9, 1, 5, 0, { date: '2026-02-05' });
    const { phases, violations } = computeSeriesQualification({
      ...snapshot,
      matches: [
        ...snapshot.matches,
        tiebreak(PRIMERA, 8, 9, '2026-01-30'),
        tiebreak(PRIMERA, 8, 9, '2026-01-31'),
        withEliminated,
      ],
    });

    expect(violations).toEqual([
      expect.objectContaining({
        match_id: withEliminated.match_id,
        message:
          `${name(9)} no está activo en Segunda Ronda: solo juegan los 8 ` +
          'equipos que clasificaron de Primera Ronda',
      }),
    ]);
    expect(phases[1].standings.every((team) => team.games_played === 0)).toBe(
      true,
    );
  });

  it('sin la fase anterior no se pueden registrar partidos', () => {
    const orphan = game(SEGUNDA, 1, 2, 1, 0);
    const { phases, violations } = computeSeriesQualification({
      teams: teams(2),
      phases: [{ phase_id: SEGUNDA, name: 'Segunda Ronda' }],
      matches: [orphan],
    });

    expect(phases[0].phase_id).toBeNull();
    expect(phases[1].blocked).toEqual({
      reason: 'missing-previous-phase',
      previous_phase: 'Primera Ronda',
    });
    expect(violations).toEqual([
      expect.objectContaining({
        match_id: orphan.match_id,
        message:
          'No se pueden registrar partidos de Segunda Ronda: antes debe crearse la fase Primera Ronda',
      }),
    ]);
  });

  it('no admite desempates sin empate en el corte ni en la Final', () => {
    const inPrimera = tiebreak(PRIMERA, 1, 2, '2026-01-20');
    const inFinal = tiebreak(FINAL, 1, 2, '2026-04-20');
    const { violations } = computeSeriesQualification({
      teams: teams(2),
      phases: ALL_PHASES,
      matches: [...wins(PRIMERA, 1, 2), inPrimera, inFinal],
    });

    expect(violations.map(({ match_id, message }) => [match_id, message])).toEqual([
      [
        inPrimera.match_id,
        'No hay empate en el corte de Primera Ronda que desempatar',
      ],
      [
        inFinal.match_id,
        'La fase Final no tiene corte, así que no admite partidos de desempate',
      ],
    ]);
  });

  it('ignora las fases con un nombre que no es de la Serie', () => {
    const { phases, violations } = computeSeriesQualification({
      teams: teams(2),
      phases: [{ phase_id: 9, name: 'Fase antigua' }],
      matches: [game(9, 1, 2, 1, 0)],
    });

    expect(phases.every((phase) => phase.phase_id === null)).toBe(true);
    expect(violations).toEqual([]);
  });
});

describe('findIntroducedViolation', () => {
  beforeEach(() => {
    nextMatchId = 1;
  });

  /** Primera Ronda desempatada (pasa el 8) y un partido de Segunda Ronda ya jugado. */
  function seriesInSegundaRonda() {
    const snapshot = tiedPrimeraRonda();
    const decidingGame = tiebreak(PRIMERA, 8, 9, '2026-01-31');
    const segundaMatch = game(SEGUNDA, 8, 1, 2, 1, { date: '2026-02-05' });

    return {
      decidingGame,
      segundaMatch,
      snapshot: {
        ...snapshot,
        matches: [
          ...snapshot.matches,
          tiebreak(PRIMERA, 8, 9, '2026-01-30'),
          decidingGame,
          segundaMatch,
        ],
      },
    };
  }

  it('acepta un alta válida', () => {
    const { snapshot } = seriesInSegundaRonda();
    const after = {
      ...snapshot,
      matches: [
        ...snapshot.matches,
        { ...game(SEGUNDA, 2, 3, 1, 0), match_id: UNSAVED_ID },
      ],
    };

    expect(findIntroducedViolation(snapshot, after, UNSAVED_ID)).toBeNull();
  });

  it('rechaza un alta con un equipo eliminado con el mensaje del propio partido', () => {
    const { snapshot } = seriesInSegundaRonda();
    const after = {
      ...snapshot,
      matches: [
        ...snapshot.matches,
        { ...game(SEGUNDA, 9, 3, 1, 0), match_id: UNSAVED_ID },
      ],
    };
    const violation = findIntroducedViolation(snapshot, after, UNSAVED_ID);

    expect(violation?.match_id).toBe(UNSAVED_ID);
    expect(describeViolation(violation!, UNSAVED_ID)).toBe(
      `${name(9)} no está activo en Segunda Ronda: solo juegan los 8 equipos que clasificaron de Primera Ronda`,
    );
  });

  it('rechaza borrar un desempate del que depende un partido posterior', () => {
    const { snapshot, decidingGame, segundaMatch } = seriesInSegundaRonda();
    const after = {
      ...snapshot,
      matches: snapshot.matches.filter(
        (match) => match.match_id !== decidingGame.match_id,
      ),
    };
    const violation = findIntroducedViolation(snapshot, after);

    expect(violation?.match_id).toBe(segundaMatch.match_id);
    expect(describeViolation(violation!)).toBe(
      'No se puede aplicar el cambio: dejaría inconsistente el partido ' +
        `del 2026-02-05 entre ${name(8)} y ${name(1)} (Segunda Ronda). ` +
        'No se pueden registrar partidos de Segunda Ronda: el corte de ' +
        `Primera Ronda está empatado entre ${name(8)} y ${name(9)} (1 punto, ` +
        '1 plaza) y se decide con series de desempate de 3 partidos a ganar 2',
    );
  });

  it('rechaza un equipo nuevo que reabre un corte ya usado', () => {
    // Con 8 equipos todos pasan a Segunda Ronda sin jugar Primera Ronda.
    const segundaMatch = game(SEGUNDA, 1, 2, 1, 0, { date: '2026-02-05' });
    const before: SeriesSnapshot = {
      teams: teams(8),
      phases: ALL_PHASES,
      matches: [segundaMatch],
    };
    // Con 9 equipos y Primera Ronda sin partidos ya no se sabe quién pasó.
    const after = {
      ...before,
      teams: [...before.teams, { team_id: UNSAVED_ID, name: 'Nuevo' }],
    };

    expect(findIntroducedViolation(before, after)?.match_id).toBe(
      segundaMatch.match_id,
    );
  });

  it('una violación anterior a la regla no bloquea otros cambios', () => {
    const legacy = game(SEGUNDA, 1, 2, 1, 0);
    const before: SeriesSnapshot = {
      teams: teams(3),
      phases: [{ phase_id: SEGUNDA, name: 'Segunda Ronda' }],
      matches: [legacy],
    };
    const after = {
      ...before,
      teams: [...before.teams, { team_id: UNSAVED_ID, name: 'Nuevo' }],
    };

    expect(findIntroducedViolation(before, after)).toBeNull();
    // Editar ese partido sin tocar lo que mira la regla también se permite…
    expect(findIntroducedViolation(before, before, legacy.match_id)).toBeNull();
    // …pero si se cambia su marcador debe quedar válido.
    const edited = {
      ...before,
      matches: [{ ...legacy, away_score: 7 }],
    };

    expect(findIntroducedViolation(before, edited, legacy.match_id)?.match_id).toBe(
      legacy.match_id,
    );
  });
});
