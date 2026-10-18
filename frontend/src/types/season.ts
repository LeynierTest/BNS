/** Competición (p. ej. "Serie Nacional de Béisbol"); se juega en temporadas. */
export interface Series {
  series_id: number;
  name: string;
}

/** Respuesta de GET /seasons. */
export interface Season {
  season_id: number;
  name: string;
  series_id: number;
  series_name: string;
  created_at: string;
  team_count: number;
  phase_count: number;
  match_count: number;
  /** Tiene algún partido: sus equipos inscritos ya no cambian. */
  started: boolean;
}

export interface CreateSeasonData {
  name: string;
  series_id?: number;
  series_name?: string;
  team_ids?: number[];
}

export function seasonLabel(season: Pick<Season, 'name' | 'series_name'>) {
  return `${season.name} · ${season.series_name}`;
}
