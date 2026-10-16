export interface Coach {
  team_member_id: number;
  name: string;
  number: number;
  years_on_team: number;
  team_id: number;
  team_name: string;
  years_experience: number;
}

export interface CoachFormData {
  name: string;
  number: number;
  years_on_team: number;
  team_id: number;
  years_experience: number;
}
