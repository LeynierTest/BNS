import api from './client';
import type { PhaseQualification } from '../types/qualification';

export async function getPhaseQualification(): Promise<
  PhaseQualification[]
> {
  const response = await api.get<PhaseQualification[]>(
    '/qualification',
  );

  return response.data;
}
