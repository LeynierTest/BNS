import api from './client';
import type { Stadium } from '../types/stadium';

export interface StadiumFormData {
  name: string;
  capacity: number;
  province: string;
}

function normalizeStadium(stadium: Stadium): Stadium {
  return {
    ...stadium,
    stadium_id: Number(stadium.stadium_id),
    capacity: Number(stadium.capacity),
  };
}

export async function getStadiums(): Promise<Stadium[]> {
  const response = await api.get<Stadium[]>('/stadiums');

  return response.data.map(normalizeStadium);
}

export interface StadiumSearchFilters {
  name?: string;
  province?: string;
  capacity?: number;
}

export async function searchStadiums(
  filters: StadiumSearchFilters,
): Promise<Stadium[]> {
  const params = new URLSearchParams();

  if (filters.name?.trim()) {
    params.set('name', filters.name.trim());
  }

  if (filters.province?.trim()) {
    params.set('province', filters.province.trim());
  }

  if (
    filters.capacity !== undefined &&
    Number.isFinite(filters.capacity)
  ) {
    params.set('capacity', String(filters.capacity));
  }

  const query = params.toString();

  const response = await api.get<Stadium[]>(
    `/stadiums/search${query ? `?${query}` : ''}`,
  );

  return response.data.map(normalizeStadium);
}

export async function getStadium(stadiumId: number): Promise<Stadium> {
  const response = await api.get<Stadium>(
    `/stadiums/${stadiumId}`,
  );

  return normalizeStadium(response.data);
}

export async function createStadium(
  data: StadiumFormData,
): Promise<Stadium> {
  const response = await api.post<Stadium>(
    '/stadiums',
    data,
  );

  return normalizeStadium(response.data);
}

export async function updateStadium(
  stadiumId: number,
  data: Partial<StadiumFormData>,
): Promise<Stadium> {
  const response = await api.patch<Stadium>(
    `/stadiums/${stadiumId}`,
    data,
  );

  return normalizeStadium(response.data);
}

export async function deleteStadium(
  stadiumId: number,
): Promise<void> {
  await api.delete(`/stadiums/${stadiumId}`);
}
