export interface Match {
  match_id: number;
  visitor_team_id: number;
  visitor_team_name: string;
  home_team_id: number;
  home_team_name: string;
  match_date: string;
  stadium_id: number;
  stadium_name: string;
  phase_id: number;
  phase_name: string;
  visitor_score: number;
  home_score: number;
  audience: number;
  /** Partido de una serie de desempate del corte (regla 8/4/2). */
  tiebreaker: boolean;
}

export interface MatchFormData {
  visitor_team_id: number;
  home_team_id: number;
  match_date: string;
  stadium_id: number;
  phase_id: number;
  visitor_score: number;
  home_score: number;
  audience: number;
  /** Partido de una serie de desempate del corte (regla 8/4/2). */
  tiebreaker: boolean;
}
