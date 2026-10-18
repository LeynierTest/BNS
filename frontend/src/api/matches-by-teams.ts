import api from './client';
import type { MatchByTeams } from '../types/matches-by-teams';

export async function getMatchesByTeams(
  homeTeamId: number,
  awayTeamId: number,
  seasonId: number,
): Promise<MatchByTeams[]> {
  const response = await api.get<MatchByTeams[]>(
    `/matches/by-teams/${homeTeamId}/${awayTeamId}`,
    { params: { season_id: seasonId } },
  );

  return response.data;
}
