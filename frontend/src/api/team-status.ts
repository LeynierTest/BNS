import api from './client';
import type { TeamStatus } from '../types/team-status';

export async function getTeamStatus(
  teamId: number,
): Promise<TeamStatus[]> {
  const response = await api.get<TeamStatus[]>(
    `/teams/${teamId}/status`,
  );

  return response.data;
}
