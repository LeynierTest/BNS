import { SERIES_PHASE_NAMES } from '../../types/phase';
import type { PhaseQualification } from '../../types/qualification';

/** Error de validación como clave de traducción + valores (sin depender de i18n). */
export interface RuleError {
  key: string;
  values: Record<string, string | number>;
}

type FormatList = (names: string[]) => string;

const BLOCKED_KEY = {
  'missing-previous-phase': 'matches.validation.missingPreviousPhase',
  'previous-phase-undecided': 'matches.validation.previousPhaseUndecided',
  'previous-cut-tied': 'matches.validation.previousCutTied',
} as const;

/** Por qué no se pueden registrar partidos en la fase, o null si se puede. */
export function getPhaseBlockedError(
  state: PhaseQualification,
  formatList: FormatList,
): RuleError | null {
  const { blocked } = state;

  if (!blocked) {
    return null;
  }

  return {
    key: BLOCKED_KEY[blocked.reason],
    values: {
      phase: state.name,
      previous: blocked.previous_phase,
      ...(blocked.reason === 'previous-cut-tied' && {
        teams: formatList(
          blocked.tie.contenders.map((team) => team.team_name),
        ),
      }),
    },
  };
}

/**
 * Regla 8/4/2, la misma que aplica el backend: solo juegan los equipos
 * activos de la fase y un desempate enfrenta a dos empatados en el corte
 * que no hayan perdido una serie. `checkTiebreak` va en false al editar un
 * desempate, porque el estado ya incluye ese partido (lo decide el backend).
 */
export function getMatchQualificationError(
  state: PhaseQualification,
  teams: { team_id: number; name: string }[],
  teamIds: number[],
  checkTiebreak: boolean,
  formatList: FormatList,
): RuleError | null {
  const blockedError = getPhaseBlockedError(state, formatList);

  if (blockedError) {
    return blockedError;
  }

  const active = new Set(
    state.participants.map((team) => team.team_id),
  );
  const inactive = teams.filter(
    (team) =>
      teamIds.includes(team.team_id) && !active.has(team.team_id),
  );

  if (inactive.length > 0) {
    return {
      key: 'matches.validation.teamNotActive',
      values: {
        count: inactive.length,
        teams: formatList(inactive.map((team) => team.name)),
        phase: state.name,
      },
    };
  }

  if (!checkTiebreak) {
    return null;
  }

  if (state.order === SERIES_PHASE_NAMES.length) {
    return {
      key: 'matches.validation.phaseWithoutCut',
      values: { phase: state.name },
    };
  }

  if (state.cut?.status === 'decided' && state.cut.tie) {
    return {
      key: 'matches.validation.tiebreakAlreadyResolved',
      values: { phase: state.name },
    };
  }

  const tie = state.cut?.status === 'tied' ? state.cut.tie : null;

  if (!tie) {
    return {
      key: 'matches.validation.noTieToBreak',
      values: { phase: state.name },
    };
  }

  const contenders = new Set(
    tie.contenders.map((team) => team.team_id),
  );

  if (!teamIds.every((teamId) => contenders.has(teamId))) {
    return {
      key: 'matches.validation.tiebreakerTeamsNotContenders',
      values: {
        teams: formatList(
          tie.contenders.map((team) => team.team_name),
        ),
      },
    };
  }

  return null;
}
