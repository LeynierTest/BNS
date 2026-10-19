import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { getApiErrorMessage } from '../api/api-error';
import { connectMatchesEvents } from '../api/matches-events';
import { getSeasons } from '../api/seasons';
import type { Season } from '../types/season';
import { SeasonContext } from './season-context';

const STORAGE_KEY = 'bnsm_season';

function readStoredSeasonId(): number | null {
  try {
    const value = Number(localStorage.getItem(STORAGE_KEY));

    return Number.isInteger(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function SeasonProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [storedId, setStoredId] = useState<number | null>(readStoredSeasonId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    // Descarta la respuesta si otra recarga la reemplazó o se desmontó.
    let ignore = false;

    async function loadSeasons() {
      try {
        const data = await getSeasons();

        if (ignore) {
          return;
        }

        setSeasons(data);
        setError(null);
      } catch (requestError) {
        if (!ignore) {
          setError(getApiErrorMessage(requestError, t('seasons.loadError')));
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadSeasons();

    return () => {
      ignore = true;
    };
  }, [reloadCount, t]);

  // Un partido nuevo puede marcar una temporada como empezada.
  useEffect(() => {
    const disconnect = connectMatchesEvents({
      onEvent: () => {
        setReloadCount((count) => count + 1);
      },
    });

    return disconnect;
  }, []);

  const selectSeason = useCallback((seasonId: number) => {
    setStoredId(seasonId);

    try {
      localStorage.setItem(STORAGE_KEY, String(seasonId));
    } catch {
      // Sin almacenamiento solo se pierde la preferencia al recargar.
    }
  }, []);

  const reloadSeasons = useCallback(() => {
    setReloadCount((count) => count + 1);
  }, []);

  const value = useMemo(() => {
    // Una temporada guardada que ya no existe cae en la más reciente.
    const selectedSeason =
      seasons.find((season) => season.season_id === storedId) ??
      seasons[0] ??
      null;

    return {
      seasons,
      selectedSeason,
      loading,
      error,
      selectSeason,
      reloadSeasons,
    };
  }, [error, loading, reloadSeasons, seasons, selectSeason, storedId]);

  return (
    <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>
  );
}
