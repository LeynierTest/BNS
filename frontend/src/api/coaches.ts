import api from './client';
import type { Coach, CoachFormData } from '../types/coach';

function normalizeCoach(value: any): Coach {
  const teamMember = value.team_member ?? {};
  const team = teamMember.team ?? {};

  return {
    team_member_id: Number(
      value.team_member_id ??
      teamMember.team_member_id ??
      value.id,
    ),
    name: String(
      teamMember.name ??
      value.name ??
      '',
    ),
    number: Number(
      teamMember.number ??
      value.number ??
      0,
    ),
    years_on_team: Number(
      teamMember.years_on_team ??
      value.years_on_team ??
      0,
    ),
    team_id: Number(
      teamMember.team_id ??
      value.team_id ??
      team.team_id ??
      0,
    ),
    team_name: String(
      team.name ??
      value.team_name ??
      '',
    ),
    years_experience: Number(
      value.years_experience ?? 0,
    ),
  };
}

export interface CoachSearchFilters {
  number?: number;
  name?: string;
  team?: string;
  years_on_team?: number;
  years_experience?: number;
}

export async function searchCoaches(
  filters: CoachSearchFilters,
): Promise<Coach[]> {
  const params = new URLSearchParams();

  if (filters.number !== undefined) {
    params.set('number', String(filters.number));
  }

  if (filters.name) {
    params.set('name', filters.name);
  }

  if (filters.team) {
    params.set('team', filters.team);
  }

  if (filters.years_on_team !== undefined) {
    params.set(
      'years_on_team',
      String(filters.years_on_team),
    );
  }

  if (filters.years_experience !== undefined) {
    params.set(
      'years_experience',
      String(filters.years_experience),
    );
  }

  const response = await api<any[]>(
    '/coaches/search',
    { params },
  );

  return response.data.map(normalizeCoach);
}

export async function getCoaches(): Promise<Coach[]> {
  const response = await api<any[]>('/coaches');

  return response.data.map(normalizeCoach);
}

export async function getCoach(
  id: number,
): Promise<Coach> {
  const response = await api<any>(
    `/coaches/${id}`,
  );

  return normalizeCoach(response.data);
}

export async function createCoach(
  data: CoachFormData,
): Promise<Coach> {
  const response = await api<any>(
    '/coaches',
    {
      method: 'POST',
      data,
    },
  );

  return normalizeCoach(response.data);
}

export async function updateCoach(
  id: number,
  data: Partial<CoachFormData>,
): Promise<Coach> {
  const response = await api<any>(
    `/coaches/${id}`,
    {
      method: 'PATCH',
      data,
    },
  );

  return normalizeCoach(response.data);
}

export async function deleteCoach(
  id: number,
): Promise<void> {
  await api(`/coaches/${id}`, {
    method: 'DELETE',
  });
}
