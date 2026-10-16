import api from './client';
import type { StadiumAttendance } from '../types/stadium-attendance';

export async function getStadiumAttendance(): Promise<StadiumAttendance[]> {
  const response = await api.get<StadiumAttendance[]>(
    '/stadiums/attendance',
  );

  return response.data;
}
