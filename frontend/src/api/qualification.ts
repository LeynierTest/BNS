import api from './client';
import type { PhaseQualification } from '../types/qualification';

export async function getPhaseQualification(
  seasonId: number,
): Promise<PhaseQualification[]> {
  const response = await api.get<PhaseQualification[]>(
    '/qualification',
    { params: { season_id: seasonId } },
  );

  return response.data;
}
