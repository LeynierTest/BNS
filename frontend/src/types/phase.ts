// Fases de la Serie en su orden; espejo de SERIES_PHASES
// (backend/src/phases/series-phases.ts). El backend solo admite estos nombres.
export const SERIES_PHASE_NAMES = [
  'Primera Ronda',
  'Segunda Ronda',
  'Play Off',
  'Final',
] as const;

export function getPhaseOrder(name: string): number {
  return SERIES_PHASE_NAMES.findIndex(
    (phaseName) => phaseName === name,
  );
}

export interface Phase {
  phase_id: number;
  name: string;
  start_date: string;
  end_date: string;
}
