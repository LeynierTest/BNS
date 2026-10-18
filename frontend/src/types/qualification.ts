// Respuesta de GET /qualification: espejo de
// backend/src/qualification/series-qualification.ts (regla 8/4/2).

export interface QualificationTeam {
  team_id: number;
  team_name: string;
}

export interface PhaseStanding extends QualificationTeam {
  games_played: number;
  points: number;
}

export interface TiebreakerSeries {
  team_a: QualificationTeam;
  team_b: QualificationTeam;
  wins_a: number;
  wins_b: number;
  winner_id: number | null;
}

export interface CutTie {
  points: number;
  /** Plazas que se reparten los empatados. */
  spots: number;
  /** Empatados que no han perdido una serie (los clasificados, si ya se decidió). */
  contenders: QualificationTeam[];
  eliminated: QualificationTeam[];
  series: TiebreakerSeries[];
}

export interface PhaseCut {
  slots: number;
  status: 'decided' | 'tied' | 'undecided';
  /** decided: todos los clasificados; tied: los que ya pasan por puntos. */
  qualified: QualificationTeam[];
  tie: CutTie | null;
}

export type PhaseBlock =
  | {
      reason: 'missing-previous-phase' | 'previous-phase-undecided';
      previous_phase: string;
    }
  | {
      reason: 'previous-cut-tied';
      previous_phase: string;
      tie: CutTie;
    };

export interface PhaseQualification {
  name: string;
  order: number;
  phase_id: number | null;
  /** null: la juegan todos los equipos (Primera Ronda). */
  active_teams: number | null;
  blocked: PhaseBlock | null;
  participants: QualificationTeam[];
  standings: PhaseStanding[];
  /** null en la Final, en una fase sin crear y en una fase bloqueada. */
  cut: PhaseCut | null;
}
