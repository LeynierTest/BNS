import api from './client';
import type { StadiumAttendance } from '../types/stadium-attendance';

export async function getStadiumAttendance(
  seasonId: number,
): Promise<StadiumAttendance[]> {
  const response = await api.get<StadiumAttendance[]>(
    '/stadiums/attendance',
    { params: { season_id: seasonId } },
  );

  return response.data;
}
