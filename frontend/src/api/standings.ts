import api from './client';
import type { Standing } from '../types/standing';

export async function getStandings(): Promise<Standing[]> {
  const response = await api.get<Standing[]>('/standings');

  return response.data;
}
