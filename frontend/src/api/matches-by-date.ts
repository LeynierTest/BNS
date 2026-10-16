import api from './client';
import type { MatchByDate } from '../types/matches-by-date';

export async function getMatchesByDate(
  date: string,
  stadiumId?: number,
): Promise<MatchByDate[]> {
  const query = stadiumId
    ? `?stadiumId=${stadiumId}`
    : '';

  const response = await api<MatchByDate[]>(
    `/matches/by-date/${date}${query}`,
  );

  return response.data;
}
