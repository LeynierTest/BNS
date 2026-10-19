import api from './client';
import type { Team } from '../types/team';
import type {
  CreateSeasonData,
  Season,
  Series,
} from '../types/season';

export async function getSeasons(): Promise<Season[]> {
  const response = await api.get<Season[]>('/seasons');

  return response.data;
}

export async function getSeries(): Promise<Series[]> {
  const response = await api.get<Series[]>('/series');

  return response.data;
}

export async function createSeason(
  data: CreateSeasonData,
): Promise<Pick<Season, 'season_id' | 'name'>> {
  const response = await api.post<Pick<Season, 'season_id' | 'name'>>(
    '/seasons',
    data,
  );

  return response.data;
}

export async function getSeasonTeams(seasonId: number): Promise<Team[]> {
  const response = await api.get<Team[]>(`/seasons/${seasonId}/teams`);

  return response.data;
}

export async function updateSeasonTeams(
  seasonId: number,
  teamIds: number[],
): Promise<Team[]> {
  const response = await api.put<Team[]>(`/seasons/${seasonId}/teams`, {
    team_ids: teamIds,
  });

  return response.data;
}
