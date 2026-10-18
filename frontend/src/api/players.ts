import api from './client';
import type { Player } from '../types/player';

export interface PlayerFormData {
  name: string;
  number: number;
  years_on_team: number;
  team_id: number;
  position: string;
  at_bats: number | null;
  innings_pitched: number | null;
  hits: number | null;
  runs_allowed: number | null;
  // Sin batting_average: lo calcula el backend (hits / at_bats).
  hits_allowed: number | null;
  walks_allowed: number | null;
  strikeouts: number | null;
  home_runs_allowed: number | null;
  hit_batsmen: number | null;
}

export interface PlayerSearchFilters {
  number?: number;
  name?: string;
  team?: string;
  position?: string;
}

interface PlayerSearchResult {
  team_member_id: number;
  number: number;
  name: string;
  team_id: number;
  team_name: string;
  player_position: string;
  years_on_team: number;
  at_bats: number | null;
  innings_pitched: number | null;
  hits: number | null;
  runs_allowed: number | null;
  batting_average: number | null;
  hits_allowed: number | null;
  walks_allowed: number | null;
  strikeouts: number | null;
  home_runs_allowed: number | null;
  hit_batsmen: number | null;
}

// Prisma serializa los DECIMAL como texto; null (lanzador) se conserva.
function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export async function getPlayers(): Promise<Player[]> {
  const response = await api.get<Player[]>('/players');

  return response.data.map((player) => ({
    ...player,
    batting_average: toNullableNumber(player.batting_average),
  }));
}

export async function searchPlayers(
  filters: PlayerSearchFilters,
): Promise<Player[]> {
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

  if (filters.position) {
    params.set('position', filters.position);
  }

  const response = await api.get<PlayerSearchResult[]>('/players/search', {
    params,
  });

  return response.data.map((player) => ({
    team_member_id: player.team_member_id,
    position: player.player_position,
    at_bats: player.at_bats,
    innings_pitched: player.innings_pitched,
    hits: player.hits,
    runs_allowed: player.runs_allowed,
    batting_average: toNullableNumber(player.batting_average),
    hits_allowed: player.hits_allowed,
    walks_allowed: player.walks_allowed,
    strikeouts: player.strikeouts,
    home_runs_allowed: player.home_runs_allowed,
    hit_batsmen: player.hit_batsmen,
    team_member: {
      team_member_id: player.team_member_id,
      name: player.name,
      number: player.number,
      years_on_team: player.years_on_team,
      team: {
        team_id: player.team_id,
        name: player.team_name,
      },
    },
  }));
}

export async function getPlayer(
  playerId: number,
): Promise<Player> {
  const response = await api.get<Player>(
    `/players/${playerId}`,
  );

  return {
    ...response.data,
    batting_average: toNullableNumber(response.data.batting_average),
  };
}

export async function createPlayer(
  data: PlayerFormData,
): Promise<Player> {
  const response = await api.post<Player>(
    '/players',
    data,
  );

  return {
    ...response.data,
    batting_average: toNullableNumber(response.data.batting_average),
  };
}

export async function updatePlayer(
  playerId: number,
  data: Partial<PlayerFormData>,
): Promise<Player> {
  const response = await api.patch<Player>(
    `/players/${playerId}`,
    data,
  );

  return {
    ...response.data,
    batting_average: toNullableNumber(response.data.batting_average),
  };
}

export async function deletePlayer(
  playerId: number,
): Promise<void> {
  await api.delete(`/players/${playerId}`);
}
