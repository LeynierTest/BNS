import {
  IsDateString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateMatchDto {
  @IsInt()
  @Min(1)
  away_team_id: number;

  @IsInt()
  @Min(1)
  home_team_id: number;

  @IsDateString()
  match_date: string;

  @IsInt()
  @Min(1)
  stadium_id: number;

  @IsInt()
  @Min(1)
  phase_id: number;

  @IsInt()
  @Min(0)
  away_score: number;

  @IsInt()
  @Min(0)
  home_score: number;

  @IsInt()
  @Min(0)
  attendance: number;
}
