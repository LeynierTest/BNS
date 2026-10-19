import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { AuthContext } from '../auth/auth-context';
import type { AuthContextValue } from '../auth/auth-context';
import { SeasonContext } from '../season/season-context';
import type { Season } from '../types/season';

export const TEST_SEASON: Season = {
  season_id: 1,
  name: 'Temporada 1',
  series_id: 1,
  series_name: 'Serie Nacional de Béisbol',
  created_at: '2026-10-18T00:00:00.000Z',
  team_count: 2,
  phase_count: 0,
  match_count: 0,
  started: false,
};

/**
 * Renderiza con una sesión iniciada con el rol indicado y una temporada
 * seleccionada (TEST_SEASON, o la que se pase).
 */
export function renderAs(
  role: 'Administrator' | 'User',
  ui: ReactElement,
  season: Season = TEST_SEASON,
) {
  const auth: AuthContextValue = {
    user: {
      user_id: 1,
      username: role === 'Administrator' ? 'admin' : 'usuario',
      email: 'prueba@bns.test',
      active: true,
      role_id: role === 'Administrator' ? 1 : 2,
      role,
      photo_url: null,
    },
    isAuthenticated: true,
    isLoading: false,
    login: async () => {},
    logout: async () => {},
    updatePhoto: async () => {},
    removePhoto: async () => {},
  };

  return render(
    <AuthContext.Provider value={auth}>
      <SeasonContext.Provider
        value={{
          seasons: [season],
          selectedSeason: season,
          loading: false,
          error: null,
          selectSeason: () => {},
          reloadSeasons: () => {},
        }}
      >
        {ui}
      </SeasonContext.Provider>
    </AuthContext.Provider>,
  );
}
