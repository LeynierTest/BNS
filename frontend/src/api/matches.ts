import api from './client';
import type { Match, MatchFormData } from '../types/match';

function normalizeMatch(value: any): Match {
  const visitorTeam =
    value.visitor_team ??
    value.away_team ??
    value.visitorTeam ??
    value.awayTeam ??
    value.team_match_away_team_idToteam ??
    {};

  const homeTeam =
    value.home_team ??
    value.homeTeam ??
    value.team_match_home_team_idToteam ??
    {};

  const stadium =
    value.stadium ??
    {};

  const phase =
    value.phase ??
    {};

  return {
    match_id: Number(
      value.match_id ??
      value.id_partido ??
      value.id,
    ),

    visitor_team_id: Number(
      value.visitor_team_id ??
      value.away_team_id ??
      value.visitor_id ??
      value.away_id ??
      visitorTeam.team_id ??
      visitorTeam.id ??
      0,
    ),

    visitor_team_name: String(
      value.visitor_team_name ??
      value.away_team_name ??
      visitorTeam.name ??
      visitorTeam.team_name ??
      '',
    ),

    home_team_id: Number(
      value.home_team_id ??
      value.home_id ??
      homeTeam.team_id ??
      homeTeam.id ??
      0,
    ),

    home_team_name: String(
      value.home_team_name ??
      homeTeam.name ??
      '',
    ),

    match_date: String(
      value.match_date ??
      value.fecha ??
      value.date ??
      '',
    ).slice(0, 10),

    stadium_id: Number(
      value.stadium_id ??
      stadium.stadium_id ??
      stadium.id ??
      0,
    ),

    stadium_name: String(
      value.stadium_name ??
      stadium.name ??
      '',
    ),

    phase_id: Number(
      value.phase_id ??
      phase.phase_id ??
      phase.id ??
      0,
    ),

    phase_name: String(
      value.phase_name ??
      phase.name ??
      '',
    ),

    visitor_score: Number(
      value.visitor_score ??
      value.away_score ??
      value.visitor_runs ??
      value.away_runs ??
      value.carreras_visitante ??
      0,
    ),

    home_score: Number(
      value.home_score ??
      value.home_runs ??
      value.carreras_local ??
      0,
    ),

    audience: Number(
      value.audience ??
      value.attendance ??
      value.asistencia ??
      0,
    ),
  };
}

function toBackendData(data: MatchFormData) {
  return {
    away_team_id: data.visitor_team_id,
    home_team_id: data.home_team_id,
    match_date: data.match_date,
    stadium_id: data.stadium_id,
    phase_id: data.phase_id,
    away_score: data.visitor_score,
    home_score: data.home_score,
    attendance: data.audience,
  };
}

export async function getMatches(): Promise<Match[]> {
  const response = await api<any[]>('/matches');
  return response.data.map(normalizeMatch);
}

export interface MatchSearchFilters {
  away_team?: string;
  home_team?: string;
  match_date?: string;
  stadium?: string;
  phase?: string;
}

export async function searchMatches(
  filters: MatchSearchFilters,
): Promise<Match[]> {
  const params = new URLSearchParams();

  if (filters.away_team?.trim()) {
    params.set('away_team', filters.away_team.trim());
  }

  if (filters.home_team?.trim()) {
    params.set('home_team', filters.home_team.trim());
  }

  if (filters.match_date?.trim()) {
    params.set('match_date', filters.match_date.trim());
  }

  if (filters.stadium?.trim()) {
    params.set('stadium', filters.stadium.trim());
  }

  if (filters.phase?.trim()) {
    params.set('phase', filters.phase.trim());
  }

  const query = params.toString();

  const response = await api<any[]>(
    `/matches/search${query ? `?${query}` : ''}`,
  );

  return response.data.map(normalizeMatch);
}

export async function getMatch(id: number): Promise<Match> {
  const response = await api<any>(`/matches/${id}`);
  return normalizeMatch(response.data);
}

export async function createMatch(
  data: MatchFormData,
): Promise<Match> {
  const response = await api<any>('/matches', {
    method: 'POST',
    data: toBackendData(data),
  });

  return normalizeMatch(response.data);
}

export async function updateMatch(
  id: number,
  data: Partial<MatchFormData>,
): Promise<Match> {
  const backendData: Record<string, unknown> = {};

  if (data.visitor_team_id !== undefined) {
    backendData.away_team_id =
      data.visitor_team_id;
  }

  if (data.home_team_id !== undefined) {
    backendData.home_team_id =
      data.home_team_id;
  }

  if (data.match_date !== undefined) {
    backendData.match_date = data.match_date;
  }

  if (data.stadium_id !== undefined) {
    backendData.stadium_id = data.stadium_id;
  }

  if (data.phase_id !== undefined) {
    backendData.phase_id = data.phase_id;
  }

  if (data.visitor_score !== undefined) {
    backendData.away_score =
      data.visitor_score;
  }

  if (data.home_score !== undefined) {
    backendData.home_score =
      data.home_score;
  }

  if (data.audience !== undefined) {
    backendData.attendance =
      data.audience;
  }

  const response = await api<any>(
    `/matches/${id}`,
    {
      method: 'PATCH',
      data: backendData,
    },
  );

  return normalizeMatch(response.data);
}

export async function deleteMatch(
  id: number,
): Promise<void> {
  await api(`/matches/${id}`, {
    method: 'DELETE',
  });
}
