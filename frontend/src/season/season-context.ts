import { createContext } from 'react';
import type { Season } from '../types/season';

export type SeasonContextValue = {
  /** Todas las temporadas, la más reciente primero. */
  seasons: Season[];
  /** La temporada que muestra la aplicación (por defecto, la más reciente). */
  selectedSeason: Season | null;
  loading: boolean;
  error: string | null;
  selectSeason: (seasonId: number) => void;
  /** Vuelve a pedir las temporadas (p. ej. tras crear una o registrar partidos). */
  reloadSeasons: () => void;
};

export const SeasonContext =
  createContext<SeasonContextValue | undefined>(undefined);
