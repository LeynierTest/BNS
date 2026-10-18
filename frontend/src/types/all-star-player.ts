/** Estadísticas del lanzador; el ERA decide la selección (menor es mejor). */
export interface PitchingStats {
  era: number;
  /** null si al lanzador le faltan datos (registrado antes de estos campos). */
  whip: number | null;
  k_per_9: number | null;
  bb_per_9: number | null;
  fip: number | null;
}

export interface AllStarPlayer {
  player_position: string;
  player_name: string;
  team_name: string;
  /** Promedio de bateo; null en el lanzador, cuyo promedio es el ERA. */
  batting_average: number | null;
  pitching: PitchingStats | null;
}
