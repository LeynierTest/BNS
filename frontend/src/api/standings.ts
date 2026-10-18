import api from './client';
import type { Standing } from '../types/standing';

export async function getStandings(
  seasonId: number,
): Promise<Standing[]> {
  const response = await api.get<Standing[]>('/standings', {
    params: { season_id: seasonId },
  });

  return response.data;
}
