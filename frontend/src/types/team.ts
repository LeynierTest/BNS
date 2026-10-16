export type Team = {
  team_id: number;
  name: string;
  province: string;
  championships_participated: number;
  championships_won: number;
  mascot: string;
  color: string;
};

export type TeamFormData = {
  name: string;
  province: string;
  championships_participated: number;
  championships_won: number;
  mascot: string;
  color: string;
};