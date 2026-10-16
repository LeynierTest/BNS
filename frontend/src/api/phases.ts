import api from './client';
import type { Phase } from '../types/phase';

export interface PhaseFormData {
  name: string;
  start_date: string;
  end_date: string;
}

function normalizePhase(value: any): Phase {
  return {
    phase_id: Number(value.phase_id ?? value.id_fase ?? value.id),
    name: String(value.name ?? value.nombre ?? ''),
    start_date: String(
      value.start_date ?? value.fecha_inicio ?? '',
    ).slice(0, 10),
    end_date: String(
      value.end_date ?? value.fecha_fin ?? '',
    ).slice(0, 10),
  };
}

export async function getPhases(): Promise<Phase[]> {
  const response = await api<any[]>('/phases');

  return response.data.map(normalizePhase);
}

export interface PhaseSearchFilters {
  name?: string;
  active_date?: string;
}

export async function searchPhases(
  filters: PhaseSearchFilters,
): Promise<Phase[]> {
  const params = new URLSearchParams();

  if (filters.name?.trim()) {
    params.set('name', filters.name.trim());
  }

  if (filters.active_date?.trim()) {
    params.set('active_date', filters.active_date.trim());
  }

  const query = params.toString();

  const response = await api<any[]>(
    `/phases/search${query ? `?${query}` : ''}`,
  );

  return response.data.map(normalizePhase);
}

export async function getPhase(
  id: number,
): Promise<Phase> {
  const response = await api<any>(`/phases/${id}`);

  return normalizePhase(response.data);
}

export async function createPhase(
  data: PhaseFormData,
): Promise<Phase> {
  const response = await api<any>('/phases', {
    method: 'POST',
    data,
  });

  return normalizePhase(response.data);
}

export async function updatePhase(
  id: number,
  data: PhaseFormData,
): Promise<Phase> {
  const response = await api<any>(`/phases/${id}`, {
    method: 'PATCH',
    data,
  });

  return normalizePhase(response.data);
}

export async function deletePhase(
  id: number,
): Promise<void> {
  await api(`/phases/${id}`, {
    method: 'DELETE',
  });
}
