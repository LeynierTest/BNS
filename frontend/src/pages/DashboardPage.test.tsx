import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderAs } from '../test/render-as';
import { DashboardPage } from './DashboardPage';

// El Dashboard usa las funciones de src/api (datos ya normalizados), no el
// cliente HTTP directamente.
vi.mock('../api/standings', () => ({
  getStandings: vi.fn().mockResolvedValue([
    { team_id: 1, team_name: 'Industriales', games_played: 3, points: 2 },
  ]),
}));
vi.mock('../api/teams', () => ({
  getTeams: vi.fn().mockResolvedValue([{ team_id: 1 }, { team_id: 2 }]),
}));
vi.mock('../api/players', () => ({
  getPlayers: vi.fn().mockResolvedValue([{}, {}, {}]),
}));
vi.mock('../api/stadiums', () => ({
  getStadiums: vi.fn().mockResolvedValue([{ stadium_id: 1 }]),
}));
vi.mock('../api/matches', () => ({
  getMatches: vi.fn().mockResolvedValue([
    {
      match_id: 7,
      visitor_team_id: 2,
      visitor_team_name: 'Santiago de Cuba',
      home_team_id: 1,
      home_team_name: 'Industriales',
      match_date: '2026-10-12',
      stadium_id: 1,
      stadium_name: 'Latinoamericano',
      phase_id: 1,
      phase_name: 'Primera Ronda',
      visitor_score: 4,
      home_score: 3,
      audience: 25000,
      tiebreaker: false,
    },
  ]),
}));
vi.mock('../api/seasons', () => ({
  getSeries: vi.fn().mockResolvedValue([
    { series_id: 1, name: 'Serie Nacional de Béisbol' },
  ]),
  createSeason: vi.fn(),
  getSeasonTeams: vi.fn(),
  updateSeasonTeams: vi.fn(),
}));
vi.mock('../api/dashboard-events', () => ({
  connectDashboardEvents: () => () => {},
}));

describe('DashboardPage', () => {
  it('muestra el último partido con los datos normalizados de src/api', async () => {
    renderAs('User', <DashboardPage />);

    expect(await screen.findByText('Santiago de Cuba')).toBeTruthy();
    expect(screen.getByText('Latinoamericano')).toBeTruthy();
    expect(screen.getByText('Primera Ronda')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    // 12/10/2026 en UTC, sin desfase de zona horaria.
    expect(screen.getByText(/12 oct 2026/)).toBeTruthy();
    expect(screen.getByText(/25\.000/)).toBeTruthy();
  });
});
