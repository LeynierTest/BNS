import api from './client';
import type { TeamStatus } from '../types/team-status';

export async function getTeamStatus(
  teamId: number,
  seasonId: number,
): Promise<TeamStatus[]> {
  const response = await api.get<TeamStatus[]>(
    `/teams/${teamId}/status`,
    { params: { season_id: seasonId } },
  );

  return response.data;
}
