import api from './client';
import type {
  Team,
  TeamFormData,
} from '../types/team';

export async function getTeams(): Promise<Team[]> {
  const response = await api.get<Team[]>('/teams');

  return response.data;
}

export type TeamSearchFilters = {
  name?: string;
  province?: string;
  color?: string;
  mascot?: string;
  championships_participated?: number;
  championships_won?: number;
};

export async function searchTeams(
  filters: TeamSearchFilters,
): Promise<Team[]> {
  const response = await api.get<Team[]>(
    '/teams/search',
    {
      params: filters,
    },
  );

  return response.data;
}

export async function getTeam(
  teamId: number,
): Promise<Team> {
  const response = await api.get<Team>(
    `/teams/${teamId}`,
  );

  return response.data;
}

export async function createTeam(
  data: TeamFormData,
): Promise<Team> {
  const response = await api.post<Team>(
    '/teams',
    data,
  );

  return response.data;
}

export async function updateTeam(
  teamId: number,
  data: Partial<TeamFormData>,
): Promise<Team> {
  const response = await api.patch<Team>(
    `/teams/${teamId}`,
    data,
  );

  return response.data;
}

export async function deleteTeam(
  teamId: number,
): Promise<void> {
  await api.delete(`/teams/${teamId}`);
}