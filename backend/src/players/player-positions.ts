// Mismas posiciones que ofrece el formulario del frontend (PlayerForm).
// El reporte "Equipo todos estrellas" agrupa por este valor, así que
// debe ser canónico para que haya exactamente un jugador por posición.
export const PLAYER_POSITIONS = [
  'Receptor',
  'Primera Base',
  'Segunda Base',
  'Tercera Base',
  'Torpedero',
  'Jardinero',
  'Lanzador',
] as const;

export type PlayerPosition = (typeof PLAYER_POSITIONS)[number];

/**
 * Misma regla que el trigger validate_player_stats de la base de datos
 * (LOWER(position) = 'lanzador'), para que servicio y trigger nunca
 * discrepen sobre qué estadísticas exige cada posición.
 */
export function isPitcherPosition(position: string): boolean {
  return position.toLowerCase() === 'lanzador';
}
