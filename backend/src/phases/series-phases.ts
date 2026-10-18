/**
 * Fases de la Serie en su orden (README) y cuántos equipos siguen activos al
 * empezar cada una. La Primera Ronda la juegan todos los equipos
 * registrados. Espejo en el frontend: `SERIES_PHASE_NAMES`
 * (`frontend/src/types/phase.ts`) y el CHECK `phase_name_ck` de la base.
 */
export const SERIES_PHASES = [
  { name: 'Primera Ronda', activeTeams: null },
  { name: 'Segunda Ronda', activeTeams: 8 },
  { name: 'Play Off', activeTeams: 4 },
  { name: 'Final', activeTeams: 2 },
] as const;

export type SeriesPhaseName = (typeof SERIES_PHASES)[number]['name'];

export const PHASE_NAMES: readonly SeriesPhaseName[] = SERIES_PHASES.map(
  (phase) => phase.name,
);

/** Posición (0 = Primera Ronda) o -1 si el nombre no es una fase de la Serie. */
export function getPhaseOrder(name: string): number {
  return PHASE_NAMES.findIndex((phaseName) => phaseName === name);
}
