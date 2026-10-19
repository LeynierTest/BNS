import { SERIES_PHASES } from '../phases/series-phases';
import type { SeriesPhaseName } from '../phases/series-phases';

/**
 * Regla 8/4/2 del enunciado: qué equipos siguen activos en cada fase.
 *
 * Entrada: equipos, fases y partidos registrados (`SeriesSnapshot`).
 * Salida: por cada fase de la Serie (Primera Ronda → Final), sus
 * participantes, su tabla de puntos y el corte hacia la fase siguiente; y los
 * partidos que contradicen la regla (`violations`).
 *
 *   participantes(Primera Ronda) = todos los equipos registrados
 *   para cada fase k, en orden:
 *     si k > 1:
 *       la fase k-1 no existe            → k bloqueada (missing-previous-phase)
 *       el corte de k-1 está empatado    → k bloqueada (previous-cut-tied)
 *       el corte de k-1 no se puede saber → k bloqueada (previous-phase-undecided)
 *       si no, participantes(k) = clasificados(k-1)
 *     todo partido de una fase bloqueada es una violación
 *     partido regular con un equipo fuera de participantes(k) → violación
 *       (y no puntúa)
 *     tabla(k): participantes, 1 punto por partido regular ganado, orden por
 *       puntos desc y nombre
 *     corte(k), plazas = equipos activos de k+1 (8, 4, 2; la Final no tiene):
 *       |participantes| <= plazas → clasifican todos
 *       ningún partido regular    → sin decidir
 *       P = puntos del puesto «plazas»
 *       el puesto siguiente tiene menos de P → clasifican los «plazas» primeros
 *       si no, empate: clasifican los de más de P puntos; los de P puntos se
 *         disputan cupos = plazas - |por encima| en series de 3 partidos a
 *         ganar 2. Los partidos de desempate de k se recorren por fecha: cada
 *         uno enfrenta a dos empatados que no hayan perdido una serie,
 *         mientras el corte siga sin decidir, y tiene ganador. Quien gana 2
 *         contra un rival gana esa serie y el rival queda eliminado. El corte
 *         se decide cuando quedan tantos empatados vivos como cupos.
 *     partido de desempate que no cumple lo anterior → violación
 *
 * Invariantes: clasificados(k) ⊆ participantes(k) y
 * |clasificados(k)| = min(plazas, |participantes(k)|) cuando está decidido.
 * Los desempates no suman en la tabla de su fase (sí en la tabla general del
 * reporte 1, que cuenta todo partido ganado).
 */

/** Victorias que necesita un equipo para ganar una serie de desempate. */
export const TIEBREAKER_WINS_NEEDED = 2;

/**
 * Id provisional de una fila que aún no existe al simular un alta. Es el
 * mayor posible para que un partido nuevo quede último dentro de su fecha.
 */
export const UNSAVED_ID = Number.MAX_SAFE_INTEGER;

export interface SeriesTeam {
  team_id: number;
  name: string;
}

export interface SeriesPhase {
  phase_id: number;
  name: string;
}

export interface SeriesMatch {
  match_id: number;
  phase_id: number;
  away_team_id: number;
  home_team_id: number;
  away_score: number;
  home_score: number;
  tiebreaker: boolean;
  /** YYYY-MM-DD */
  match_date: string;
}

export interface SeriesSnapshot {
  /** Equipos que juegan la Primera Ronda (los inscritos en la temporada). */
  teams: SeriesTeam[];
  /** Nombres de todos los equipos, para nombrar en los mensajes a uno no inscrito. */
  teamNames?: SeriesTeam[];
  phases: SeriesPhase[];
  matches: SeriesMatch[];
}

export interface TeamRef {
  team_id: number;
  team_name: string;
}

export interface PhaseStanding extends TeamRef {
  games_played: number;
  points: number;
}

export interface TiebreakerSeries {
  team_a: TeamRef;
  team_b: TeamRef;
  wins_a: number;
  wins_b: number;
  winner_id: number | null;
}

export interface CutTie {
  points: number;
  /** Plazas que se reparten los empatados. */
  spots: number;
  /** Empatados que no han perdido una serie (los clasificados, si ya se decidió). */
  contenders: TeamRef[];
  /** Empatados que perdieron una serie de desempate. */
  eliminated: TeamRef[];
  series: TiebreakerSeries[];
}

export interface PhaseCut {
  slots: number;
  /** decided: `qualified` está completo; tied: solo los que clasifican por puntos. */
  status: 'decided' | 'tied' | 'undecided';
  qualified: TeamRef[];
  /** Empate en el corte, también cuando ya se resolvió con desempates. */
  tie: CutTie | null;
}

export type PhaseBlock =
  | {
      reason: 'missing-previous-phase' | 'previous-phase-undecided';
      previous_phase: SeriesPhaseName;
    }
  | {
      reason: 'previous-cut-tied';
      previous_phase: SeriesPhaseName;
      tie: CutTie;
    };

export interface PhaseQualification {
  name: SeriesPhaseName;
  order: number;
  phase_id: number | null;
  /** null: la juegan todos los equipos (Primera Ronda). */
  active_teams: number | null;
  blocked: PhaseBlock | null;
  participants: TeamRef[];
  standings: PhaseStanding[];
  /** null en la Final, en una fase sin crear y en una fase bloqueada. */
  cut: PhaseCut | null;
}

export interface SeriesViolation {
  match_id: number;
  /** p. ej. «del 2026-02-05 entre Industriales y Matanzas (Segunda Ronda)» */
  match_label: string;
  message: string;
}

export interface SeriesQualification {
  phases: PhaseQualification[];
  violations: SeriesViolation[];
}

function formatList(items: string[]): string {
  if (items.length <= 1) {
    return items.join('');
  }

  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function byName(a: TeamRef, b: TeamRef) {
  return (
    a.team_name.localeCompare(b.team_name, 'es') || a.team_id - b.team_id
  );
}

function chronologically(a: SeriesMatch, b: SeriesMatch) {
  return (
    a.match_date.localeCompare(b.match_date) || a.match_id - b.match_id
  );
}

function toRef({ team_id, team_name }: TeamRef): TeamRef {
  return { team_id, team_name };
}

function blockedMessage(phase: SeriesPhaseName, block: PhaseBlock) {
  const prefix = `No se pueden registrar partidos de ${phase}`;

  switch (block.reason) {
    case 'missing-previous-phase':
      return `${prefix}: antes debe crearse la fase ${block.previous_phase}`;
    case 'previous-phase-undecided':
      return `${prefix}: todavía no se sabe qué equipos clasifican de ${block.previous_phase}`;
    case 'previous-cut-tied':
      return (
        `${prefix}: el corte de ${block.previous_phase} está empatado entre ` +
        `${formatList(block.tie.contenders.map((team) => team.team_name))} ` +
        `(${plural(block.tie.points, 'punto', 'puntos')}, ` +
        `${plural(block.tie.spots, 'plaza', 'plazas')}) y se decide con ` +
        'series de desempate de 3 partidos a ganar 2'
      );
  }
}

function buildStandings(
  participants: TeamRef[],
  matches: SeriesMatch[],
): PhaseStanding[] {
  const standings = new Map<number, PhaseStanding>(
    participants.map((team) => [
      team.team_id,
      { ...toRef(team), games_played: 0, points: 0 },
    ]),
  );

  for (const match of matches) {
    const away = standings.get(match.away_team_id);
    const home = standings.get(match.home_team_id);

    if (!away || !home) {
      continue;
    }

    away.games_played += 1;
    home.games_played += 1;

    if (match.away_score > match.home_score) {
      away.points += 1;
    } else if (match.home_score > match.away_score) {
      home.points += 1;
    }
  }

  return [...standings.values()].sort(
    (a, b) => b.points - a.points || byName(a, b),
  );
}

function computeCut(
  standings: PhaseStanding[],
  slots: number,
  regularMatches: number,
): PhaseCut {
  if (standings.length <= slots) {
    return {
      slots,
      status: 'decided',
      qualified: standings.map(toRef),
      tie: null,
    };
  }

  if (regularMatches === 0) {
    return { slots, status: 'undecided', qualified: [], tie: null };
  }

  const cutPoints = standings[slots - 1].points;

  if (standings[slots].points < cutPoints) {
    return {
      slots,
      status: 'decided',
      qualified: standings.slice(0, slots).map(toRef),
      tie: null,
    };
  }

  const above = standings.filter((team) => team.points > cutPoints);

  return {
    slots,
    status: 'tied',
    qualified: above.map(toRef),
    tie: {
      points: cutPoints,
      spots: slots - above.length,
      contenders: standings
        .filter((team) => team.points === cutPoints)
        .map(toRef),
      eliminated: [],
      series: [],
    },
  };
}

/**
 * Aplica los partidos de desempate (en orden cronológico) a un corte
 * empatado y devuelve los que no son válidos con su motivo.
 */
function resolveTiebreak(
  phase: SeriesPhaseName,
  cut: PhaseCut,
  tie: CutTie,
  tiebreakers: SeriesMatch[],
): { match: SeriesMatch; message: string }[] {
  const alive = new Map(
    tie.contenders.map((team) => [team.team_id, team]),
  );
  const series = new Map<string, TiebreakerSeries>();
  const invalid: { match: SeriesMatch; message: string }[] = [];

  for (const match of tiebreakers) {
    if (alive.size === tie.spots) {
      invalid.push({
        match,
        message: `El desempate del corte de ${phase} ya está resuelto`,
      });
      continue;
    }

    const away = alive.get(match.away_team_id);
    const home = alive.get(match.home_team_id);

    if (!away || !home) {
      invalid.push({
        match,
        message:
          `Solo pueden jugar el desempate de ${phase} los equipos empatados ` +
          `en el corte que no hayan perdido una serie: ${formatList(
            [...alive.values()].map((team) => team.team_name),
          )}`,
      });
      continue;
    }

    if (match.away_score === match.home_score) {
      invalid.push({
        match,
        message: 'Un partido de desempate no puede terminar empatado',
      });
      continue;
    }

    const [teamA, teamB] =
      away.team_id < home.team_id ? [away, home] : [home, away];
    const key = `${teamA.team_id}-${teamB.team_id}`;
    const current = series.get(key) ?? {
      team_a: toRef(teamA),
      team_b: toRef(teamB),
      wins_a: 0,
      wins_b: 0,
      winner_id: null,
    };
    series.set(key, current);

    const winnerId =
      match.away_score > match.home_score ? away.team_id : home.team_id;

    if (winnerId === teamA.team_id) {
      current.wins_a += 1;
    } else {
      current.wins_b += 1;
    }

    if (Math.max(current.wins_a, current.wins_b) === TIEBREAKER_WINS_NEEDED) {
      const loser = winnerId === teamA.team_id ? teamB : teamA;

      current.winner_id = winnerId;
      alive.delete(loser.team_id);
      tie.eliminated.push(toRef(loser));
    }
  }

  tie.series = [...series.values()];
  tie.contenders = tie.contenders.filter((team) => alive.has(team.team_id));

  if (alive.size === tie.spots) {
    cut.status = 'decided';
    cut.qualified = [...cut.qualified, ...tie.contenders];
  }

  return invalid;
}

export function computeSeriesQualification(
  snapshot: SeriesSnapshot,
): SeriesQualification {
  const teamNames = new Map(
    [...(snapshot.teamNames ?? []), ...snapshot.teams].map((team) => [
      team.team_id,
      team.name,
    ]),
  );
  const teamName = (teamId: number) =>
    teamNames.get(teamId) ?? `Equipo #${teamId}`;
  const allTeams = snapshot.teams
    .map((team) => ({ team_id: team.team_id, team_name: team.name }))
    .sort(byName);

  const phases: PhaseQualification[] = [];
  const violations: SeriesViolation[] = [];

  SERIES_PHASES.forEach((definition, index) => {
    const previous = phases[index - 1];
    const next = SERIES_PHASES[index + 1];
    const phaseRow = snapshot.phases
      .filter((phase) => phase.name === definition.name)
      .sort((a, b) => a.phase_id - b.phase_id)[0];

    let blocked: PhaseBlock | null = null;

    if (previous) {
      if (previous.phase_id === null) {
        blocked = {
          reason: 'missing-previous-phase',
          previous_phase: previous.name,
        };
      } else if (previous.cut?.status === 'tied' && previous.cut.tie) {
        blocked = {
          reason: 'previous-cut-tied',
          previous_phase: previous.name,
          tie: previous.cut.tie,
        };
      } else if (previous.cut?.status !== 'decided') {
        blocked = {
          reason: 'previous-phase-undecided',
          previous_phase: previous.name,
        };
      }
    }

    const participants = blocked
      ? []
      : previous
        ? (previous.cut?.qualified ?? [])
        : allTeams;
    const phaseMatches = phaseRow
      ? snapshot.matches
          .filter((match) => match.phase_id === phaseRow.phase_id)
          .sort(chronologically)
      : [];

    const addViolation = (match: SeriesMatch, message: string) => {
      violations.push({
        match_id: match.match_id,
        match_label:
          `del ${match.match_date} entre ${teamName(match.away_team_id)} ` +
          `y ${teamName(match.home_team_id)} (${definition.name})`,
        message,
      });
    };

    const result: PhaseQualification = {
      name: definition.name,
      order: index + 1,
      phase_id: phaseRow?.phase_id ?? null,
      active_teams: definition.activeTeams,
      blocked,
      participants,
      standings: [],
      cut: null,
    };
    phases.push(result);

    if (blocked) {
      for (const match of phaseMatches) {
        addViolation(match, blockedMessage(definition.name, blocked));
      }
      return;
    }

    const participantIds = new Set(
      participants.map((team) => team.team_id),
    );
    const regular: SeriesMatch[] = [];
    const tiebreakers: SeriesMatch[] = [];

    for (const match of phaseMatches) {
      if (match.tiebreaker) {
        tiebreakers.push(match);
        continue;
      }

      const outsiders = [match.away_team_id, match.home_team_id]
        .filter((teamId) => !participantIds.has(teamId))
        .map(teamName);

      if (outsiders.length > 0) {
        addViolation(
          match,
          `${formatList(outsiders)} no ${
            outsiders.length === 1 ? 'está activo' : 'están activos'
          } en ${definition.name}` +
            (previous
              ? participants.length === 1
                ? `: solo juega el equipo que clasificó de ${previous.name}`
                : `: solo juegan los ${participants.length} equipos que clasificaron de ${previous.name}`
              : ''),
        );
        continue;
      }

      regular.push(match);
    }

    result.standings = buildStandings(participants, regular);

    const slots = next?.activeTeams ?? null;

    if (phaseRow && slots !== null) {
      result.cut = computeCut(result.standings, slots, regular.length);
    }

    const { cut } = result;

    if (cut?.status === 'tied' && cut.tie) {
      for (const { match, message } of resolveTiebreak(
        definition.name,
        cut,
        cut.tie,
        tiebreakers,
      )) {
        addViolation(match, message);
      }
      return;
    }

    for (const match of tiebreakers) {
      addViolation(
        match,
        next
          ? `No hay empate en el corte de ${definition.name} que desempatar`
          : `La fase ${definition.name} no tiene corte, así que no admite partidos de desempate`,
      );
    }
  });

  return { phases, violations };
}

const RULE_FIELDS = [
  'phase_id',
  'away_team_id',
  'home_team_id',
  'away_score',
  'home_score',
  'tiebreaker',
  'match_date',
] as const;

function sameMatch(
  before: SeriesSnapshot,
  after: SeriesSnapshot,
  matchId: number,
) {
  const previous = before.matches.find((match) => match.match_id === matchId);
  const current = after.matches.find((match) => match.match_id === matchId);

  return (
    previous !== undefined &&
    current !== undefined &&
    RULE_FIELDS.every((field) => previous[field] === current[field])
  );
}

/**
 * Compara la Serie antes y después de un cambio y devuelve la primera
 * violación que ese cambio introduce, o null si la regla se mantiene.
 *
 * Una violación preexistente (datos anteriores a la regla) no bloquea otros
 * cambios; sí se exige que el partido que se está escribiendo (`focusMatchId`)
 * quede válido si cambió algo que la regla mira (equipos, fase, marcador,
 * desempate o fecha).
 */
export function findIntroducedViolation(
  before: SeriesSnapshot,
  after: SeriesSnapshot,
  focusMatchId?: number,
): SeriesViolation | null {
  const known = new Set(
    computeSeriesQualification(before).violations.map(
      (violation) => violation.match_id,
    ),
  );
  const focusChanged =
    focusMatchId !== undefined && !sameMatch(before, after, focusMatchId);
  const introduced = computeSeriesQualification(after).violations.filter(
    (violation) =>
      !known.has(violation.match_id) ||
      (focusChanged && violation.match_id === focusMatchId),
  );

  return (
    introduced.find((violation) => violation.match_id === focusMatchId) ??
    introduced[0] ??
    null
  );
}

/** Mensaje para el cliente: directo si es el partido que se escribe. */
export function describeViolation(
  violation: SeriesViolation,
  focusMatchId?: number,
): string {
  if (violation.match_id === focusMatchId) {
    return violation.message;
  }

  return `No se puede aplicar el cambio: dejaría inconsistente el partido ${violation.match_label}. ${violation.message}`;
}
