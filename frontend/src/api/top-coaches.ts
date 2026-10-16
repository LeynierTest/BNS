import api from './client';
import type { TopCoach } from '../types/top-coach';

export async function getTopCoaches(): Promise<TopCoach[]> {
  const response = await api.get<TopCoach[]>('/coaches/top');
  return response.data;
}
