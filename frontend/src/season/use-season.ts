import { useContext } from 'react';
import { SeasonContext } from './season-context';

export function useSeason() {
  const context = useContext(SeasonContext);

  if (!context) {
    throw new Error('useSeason debe utilizarse dentro de SeasonProvider');
  }

  return context;
}

/**
 * La temporada seleccionada en una página: el layout solo muestra las
 * páginas cuando ya hay una.
 */
export function useSelectedSeason() {
  const { selectedSeason } = useSeason();

  if (!selectedSeason) {
    throw new Error('No hay ninguna temporada seleccionada');
  }

  return selectedSeason;
}
