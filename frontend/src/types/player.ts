export interface PlayerTeam {
  team_id: number;
  name: string;
}

export interface PlayerTeamMember {
  team_member_id: number;
  name: string;
  number: number;
  years_on_team: number;
  team: PlayerTeam;
}

export interface Player {
  team_member_id: number;
  position: string;
  at_bats: number | null;
  innings_pitched: number | null;
  hits: number | null;
  runs_allowed: number | null;
  /**
   * Hits / veces al bate, calculado por el backend; null sin turnos al bate
   * y en el lanzador (su promedio es el ERA).
   */
  batting_average: number | null;
  hits_allowed: number | null;
  walks_allowed: number | null;
  strikeouts: number | null;
  home_runs_allowed: number | null;
  hit_batsmen: number | null;
  team_member: PlayerTeamMember;
}

/**
 * Entradas lanzadas en notación de béisbol: el decimal son outs (90.2 =
 * 90 ⅔), así que solo vale .0, .1 o .2. Misma regla que isBaseballInnings
 * en backend/src/players/innings-pitched.ts.
 */
/** Promedio de bateo como lo calcula el backend (hits / at_bats, 3 decimales). */
export function computeBattingAverage(
  atBats: number,
  hits: number,
): number | null {
  if (atBats <= 0 || hits > atBats) {
    return null;
  }

  return Math.round((hits / atBats) * 1000) / 1000;
}

export function isBaseballInnings(value: number): boolean {
  if (!Number.isFinite(value) || value < 0) {
    return false;
  }

  const tenths = Math.round(value * 10);

  return Math.abs(value * 10 - tenths) < 1e-9 && tenths % 10 <= 2;
}
