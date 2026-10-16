export interface PlayerTeam {
  team_id: number;
  name: string;
}

export interface PlayerTeamMember {
  team_member_id: number;
  name: string;
  number: number;
  years_on_team: number;
  team: PlayerTeam;
}

export interface Player {
  team_member_id: number;
  position: string;
  at_bats: number | null;
  innings_pitched: number | null;
  hits: number | null;
  runs_allowed: number | null;
  batting_average: number;
  team_member: PlayerTeamMember;
}
