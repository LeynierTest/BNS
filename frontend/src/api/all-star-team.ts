import api from './client';
import type { AllStarPlayer } from '../types/all-star-player';

export async function getAllStarTeam(): Promise<AllStarPlayer[]> {
  const response = await api.get<AllStarPlayer[]>(
    '/players/all-star',
  );

  return response.data;
}
