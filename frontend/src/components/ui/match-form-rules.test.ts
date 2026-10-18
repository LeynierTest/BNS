import { describe, expect, it } from 'vitest';
import i18n from '../../i18n';
import type {
  CutTie,
  PhaseQualification,
  QualificationTeam,
} from '../../types/qualification';
import {
  getMatchQualificationError,
  getPhaseBlockedError,
} from './match-form-rules';

const team = (team_id: number, team_name: string): QualificationTeam => ({
  team_id,
  team_name,
});

const industriales = team(1, 'Industriales');
const santiago = team(2, 'Santiago de Cuba');
const pinar = team(3, 'Pinar del Río');
const matanzas = team(4, 'Matanzas');
const villaClara = team(5, 'Villa Clara');
const all = [industriales, santiago, pinar, matanzas, villaClara];
const teams = all.map(({ team_id, team_name }) => ({ team_id, name: team_name }));

const tie: CutTie = {
  points: 1,
  spots: 1,
  contenders: [matanzas, villaClara],
  eliminated: [],
  series: [],
};

function phase(overrides: Partial<PhaseQualification>): PhaseQualification {
  return {
    name: 'Segunda Ronda',
    order: 2,
    phase_id: 2,
    active_teams: 8,
    blocked: null,
    participants: all,
    standings: [],
    cut: null,
    ...overrides,
  };
}

const segundaTied = phase({
  cut: {
    slots: 4,
    status: 'tied',
    qualified: [industriales, santiago, pinar],
    tie,
  },
});
const segundaDecided = phase({
  cut: {
    slots: 4,
    status: 'decided',
    qualified: [industriales, santiago, pinar, matanzas],
    tie: { ...tie, contenders: [matanzas], eliminated: [villaClara] },
  },
});
const primera = phase({
  name: 'Primera Ronda',
  order: 1,
  phase_id: 1,
  active_teams: null,
  cut: { slots: 8, status: 'decided', qualified: all, tie: null },
});
const playOffBlocked = phase({
  name: 'Play Off',
  order: 3,
  phase_id: 3,
  active_teams: 4,
  blocked: {
    reason: 'previous-cut-tied',
    previous_phase: 'Segunda Ronda',
    tie,
  },
  participants: [],
});
const playOffOpen = phase({
  name: 'Play Off',
  order: 3,
  phase_id: 3,
  active_teams: 4,
  participants: [industriales, santiago, pinar, matanzas],
});
const final = phase({
  name: 'Final',
  order: 4,
  phase_id: 4,
  active_teams: 2,
  participants: [industriales, matanzas],
});

const formatList = (names: string[]) => names.join(' y ');

describe('getMatchQualificationError (misma regla que el backend)', () => {
  it.each([
    ['partido con el corte anterior empatado', playOffBlocked, [1, 2], false, {
      key: 'matches.validation.previousCutTied',
      values: {
        phase: 'Play Off',
        previous: 'Segunda Ronda',
        teams: 'Matanzas y Villa Clara',
      },
    }],
    ['un equipo eliminado', playOffOpen, [5, 1], false, {
      key: 'matches.validation.teamNotActive',
      values: { count: 1, teams: 'Villa Clara', phase: 'Play Off' },
    }],
    ['dos equipos activos', playOffOpen, [1, 4], false, null],
    ['desempate entre los empatados', segundaTied, [4, 5], true, null],
    ['desempate con un equipo no empatado', segundaTied, [1, 4], true, {
      key: 'matches.validation.tiebreakerTeamsNotContenders',
      values: { teams: 'Matanzas y Villa Clara' },
    }],
    ['desempate con la serie ya resuelta', segundaDecided, [4, 5], true, {
      key: 'matches.validation.tiebreakAlreadyResolved',
      values: { phase: 'Segunda Ronda' },
    }],
    ['desempate sin empate en el corte', primera, [4, 5], true, {
      key: 'matches.validation.noTieToBreak',
      values: { phase: 'Primera Ronda' },
    }],
    ['desempate en la Final', final, [1, 4], true, {
      key: 'matches.validation.phaseWithoutCut',
      values: { phase: 'Final' },
    }],
    ['partido regular en una fase con empate (no se revisa el desempate)', segundaTied, [1, 2], false, null],
  ] as const)('%s', (_label, state, teamIds, checkTiebreak, expected) => {
    expect(
      getMatchQualificationError(
        state,
        teams,
        [...teamIds],
        checkTiebreak,
        formatList,
      ),
    ).toEqual(expected);
  });

  it('una fase sin la anterior creada está bloqueada', () => {
    expect(
      getPhaseBlockedError(
        phase({
          blocked: {
            reason: 'missing-previous-phase',
            previous_phase: 'Primera Ronda',
          },
        }),
        formatList,
      ),
    ).toEqual({
      key: 'matches.validation.missingPreviousPhase',
      values: { phase: 'Segunda Ronda', previous: 'Primera Ronda' },
    });
  });

  it.each(['es', 'en'])('todas las claves existen en %s', (language) => {
    const keys = [
      'missingPreviousPhase',
      'previousPhaseUndecided',
      'previousCutTied',
      'noTieToBreak',
      'tiebreakAlreadyResolved',
      'phaseWithoutCut',
      'tiebreakerTeamsNotContenders',
      'tiebreakerDraw',
    ];

    for (const key of keys) {
      expect(i18n.exists(`matches.validation.${key}`, { lng: language })).toBe(true);
    }
    expect(
      i18n.exists('matches.validation.teamNotActive', { lng: language, count: 2 }),
    ).toBe(true);
  });
});
