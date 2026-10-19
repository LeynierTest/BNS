import api from './client';
import type { MatchByDate } from '../types/matches-by-date';

export async function getMatchesByDate(
  date: string,
  stadiumId: number | undefined,
  seasonId: number,
): Promise<MatchByDate[]> {
  const response = await api.get<MatchByDate[]>(
    `/matches/by-date/${date}`,
    {
      params: {
        season_id: seasonId,
        ...(stadiumId ? { stadiumId } : {}),
      },
    },
  );

  return response.data;
}
