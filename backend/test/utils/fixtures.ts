import type { loginAs } from './test-app';

type Agent = Awaited<ReturnType<typeof loginAs>>;

export const validTeam = {
  name: 'Industriales',
  province: 'La Habana',
  championships_participated: 50,
  championships_won: 12,
  mascot: 'León',
  color: 'Azul',
};

async function created<T>(
  agent: Agent,
  path: string,
  body: object,
): Promise<T> {
  const response = await agent.post(path).send(body);

  if (response.status !== 201) {
    throw new Error(
      `POST ${path} respondió ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }

  return response.body as T;
}

export function createTeam(
  agent: Agent,
  overrides: Partial<typeof validTeam> = {},
) {
  return created<{ team_id: number; name: string }>(agent, '/teams', {
    ...validTeam,
    ...overrides,
  });
}

export function createStadium(
  agent: Agent,
  name: string,
  capacity: number,
) {
  return created<{ stadium_id: number; name: string }>(
    agent,
    '/stadiums',
    {
      name,
      capacity,
      province: 'La Habana',
    },
  );
}

export function createPhase(
  agent: Agent,
  name: string,
  startDate: string,
  endDate: string,
) {
  return created<{ phase_id: number; name: string }>(agent, '/phases', {
    name,
    start_date: startDate,
    end_date: endDate,
  });
}

export function createMatch(
  agent: Agent,
  match: {
    away_team_id: number;
    home_team_id: number;
    match_date: string;
    stadium_id: number;
    phase_id: number;
    away_score: number;
    home_score: number;
    attendance: number;
    tiebreaker?: boolean;
  },
) {
  return created<{ match_id: number; tiebreaker: boolean }>(
    agent,
    '/matches',
    match,
  );
}

export function createCoach(
  agent: Agent,
  teamId: number,
  name: string,
  number: number,
  yearsExperience: number,
) {
  return created<{ team_member_id: number }>(agent, '/coaches', {
    name,
    number,
    years_on_team: 1,
    team_id: teamId,
    years_experience: yearsExperience,
  });
}

export function createBatter(
  agent: Agent,
  teamId: number,
  name: string,
  number: number,
  position: string,
  battingAverage: number,
) {
  return created<{ team_member_id: number }>(agent, '/players', {
    name,
    number,
    years_on_team: 1,
    team_id: teamId,
    position,
    at_bats: 100,
    hits: Math.round(battingAverage * 100),
    innings_pitched: null,
    runs_allowed: null,
    batting_average: battingAverage,
  });
}

export interface PitchingLine {
  /** Notación de béisbol: 90.2 = 90 ⅔ entradas. */
  innings_pitched: number;
  runs_allowed: number;
  hits_allowed: number;
  walks_allowed: number;
  strikeouts: number;
  home_runs_allowed: number;
  hit_batsmen: number;
}

export function createPitcher(
  agent: Agent,
  teamId: number,
  name: string,
  number: number,
  pitching: PitchingLine,
) {
  return created<{ team_member_id: number }>(agent, '/players', {
    name,
    number,
    years_on_team: 1,
    team_id: teamId,
    position: 'Lanzador',
    at_bats: null,
    hits: null,
    ...pitching,
  });
}
